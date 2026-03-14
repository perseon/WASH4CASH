import { Elysia, t } from "elysia";
import { cors } from '@elysiajs/cors'
import { prisma } from "./lib/prisma";

// --- POS TERMINAL SIMULATOR ---
const posWorker = new Worker(new URL('./simulated/pos_term.ts', import.meta.url).href);

// Store last POS status to replay to new connections
let lastPosStatus: any = null;

// Store WebSocket connections to broadcast POS updates
const activeConnections = new Set<any>();

posWorker.onmessage = async (event) => {
  const { type, payload } = event.data;
  console.log(`📡 [Backend] Message from POS Worker: ${type}`, JSON.stringify(payload));

  if (type === 'STATUS_UPDATE') {
    lastPosStatus = { type: 'pos_update', data: { type, payload } };
  }

  // --- AUTOMATIC BOOKING ON SUCCESS ---
  if (type === 'TRANSACTION_RESULT' && payload.success) {
    const { machineId, programId, amount } = payload;
    if (machineId && programId) {
      console.log(`💾 [Backend] Payment successful. Recording booking for Machine #${machineId}...`);
      try {
        // 1. Create Transaction record
        await prisma.transaction.create({
          data: {
            machineId,
            programId,
            amount: amount || 0,
            status: 'PAID'
          }
        });

        // 2. Start the machine (triggering the worker)
        const program = await prisma.program.findUnique({ where: { id: programId } });
        const worker = machineWorkers.get(machineId);

        if (program && worker) {
          const totalDurationSeconds = program.durationMin * 60;
          const expectedEndTime = new Date(Date.now() + totalDurationSeconds * 1000);

          await prisma.machine.update({
            where: { id: machineId },
            data: { status: 'BUSY', expectedEndTime, totalDurationSeconds }
          });

          worker.postMessage({ type: 'START', payload: { durationMin: program.durationMin } });
          console.log(`✅ [Backend] Machine #${machineId} started automatically after payment.`);
        }
      } catch (err) {
        console.error("❌ [Backend] Failed to auto-book after payment:", err);
      }
    }
  }
  // ------------------------------------

  const broadcastMsg = { type: 'pos_update', data: { type, payload } };
  const clientCount = activeConnections.size;

  if (clientCount === 0) {
    console.warn("⚠️ [Backend] No active WebSocket connections to broadcast to");
  } else {
    console.log(`📣 [Backend] Broadcasting ${type} to ${clientCount} clients`);
  }

  // Broadcast to all active WebSocket clients
  for (const ws of activeConnections) {
    try {
      ws.send(broadcastMsg);
    } catch (err) {
      console.error("❌ [Backend] Failed to send message to a client:", err);
      activeConnections.delete(ws);
    }
  }
};
// ------------------------------

// --- MACHINE SIMULATOR MANAGER ---
const machineWorkers = new Map<number, Worker>();

async function initMachines() {
  const machines = await prisma.machine.findMany();
  console.log(`🏭 [Backend] Initializing ${machines.length} machines...`);

  for (const m of machines) {
    const worker = new Worker(new URL('./simulated/machine_worker.ts', import.meta.url).href);

    let remainingTime = 0;
    if (m.status === 'BUSY' && m.expectedEndTime) {
      const now = new Date();
      const diff = Math.floor((m.expectedEndTime.getTime() - now.getTime()) / 1000);
      if (diff > 0) {
        remainingTime = diff;
      } else {
        // Time expired while server was down
        await prisma.machine.update({
          where: { id: m.id },
          data: { status: 'DONE', expectedEndTime: null, totalDurationSeconds: null }
        });
        m.status = 'DONE';
      }
    }

    worker.postMessage({
      type: 'INIT',
      payload: {
        id: m.id,
        status: m.status,
        remainingTime,
        totalDurationSeconds: m.totalDurationSeconds
      }
    });

    worker.onmessage = async (event) => {
      const { type, payload } = event.data;
      if (type === 'MACHINE_STATE') {
        const { machineId, status, remainingTime } = payload;

        // If it's DONE, clear the persistence fields
        const updateData: any = { status };
        if (status === 'IDLE' || status === 'DONE') {
          updateData.expectedEndTime = null;
          updateData.totalDurationSeconds = null;
        }

        // Update DB
        await prisma.machine.update({
          where: { id: machineId },
          data: updateData
        });

        // Broadcast to clients (use worker payload which now includes totalDurationSeconds)
        for (const ws of activeConnections) {
          ws.send({
            type: 'machine_update',
            data: {
              ...payload
            }
          });
        }

        if (status === 'DONE') {
          console.log(`🔔 [Backend] Machine #${machineId} finished its cycle!`);
        }
      }
    };

    machineWorkers.set(m.id, worker);
  }
}

initMachines();
// ---------------------------------

const app = new Elysia()
  .use(cors())
  .get("/", () => "Hello Elysia Laundromat v1.0")
  .get("/users", () => prisma.user.findMany())
  .get("/machines", async () => {
    return prisma.machine.findMany();
  })
  .post("/machines/:id/start", async ({ params, body }: any) => {
    const id = parseInt(params.id);
    const { programId } = body;

    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) throw new Error("Program not found");

    const worker = machineWorkers.get(id);
    if (!worker) throw new Error("Machine worker not found");

    const totalDurationSeconds = program.durationMin * 60;
    const expectedEndTime = new Date(Date.now() + totalDurationSeconds * 1000);

    // Save timer state to DB
    await prisma.machine.update({
      where: { id },
      data: {
        status: 'BUSY',
        expectedEndTime,
        totalDurationSeconds
      }
    });

    worker.postMessage({ type: 'START', payload: { durationMin: program.durationMin } });

    return { success: true, message: `Machine #${id} started for ${program.name}` };
  }, {
    body: t.Object({
      programId: t.Number()
    })
  })
  .get("/programs", async () => {
    return prisma.program.findMany();
  })
  .post("/programs", async ({ body }: any) => {
    return prisma.program.create({ data: body });
  }, {
    body: t.Object({
      name: t.String(),
      type: t.Union([t.Literal('WASHER'), t.Literal('DRYER')]),
      durationMin: t.Number(),
      price: t.Number()
    })
  })
  .put("/programs/:id", async ({ params, body }: any) => {
    return prisma.program.update({
      where: { id: parseInt(params.id) },
      data: body
    });
  })
  .delete("/programs/:id", async ({ params }: any) => {
    return prisma.program.delete({ where: { id: parseInt(params.id) } });
  })
  .post("/trigger-pos", async ({ body }) => {
    const { machineId, programId } = body;

    const parsedMachineId = Number(machineId);
    const parsedProgramId = Number(programId);

    if (isNaN(parsedMachineId) || isNaN(parsedProgramId)) {
      console.error("❌ [Backend] Missing or invalid IDs in trigger-pos body:", body);
      return { success: false, error: "Missing required parameters (machineId/programId)" };
    }

    try {
      const machine = await prisma.machine.findUnique({ where: { id: parsedMachineId } });
      const program = await prisma.program.findUnique({ where: { id: parsedProgramId } });

      if (!machine || !program) {
        return { success: false, error: "Machine or Program not found" };
      }

      console.log(`🔌 [Backend] Triggering POS for ${machine.name} - ${program.name} ($${program.price})`);
      
      posWorker.postMessage({
        type: 'START_TRANSACTION',
        payload: { 
          amount: program.price, 
          currency: 'USD', 
          serviceName: `${machine.name} — ${program.name}`, 
          machineId: parsedMachineId, 
          programId: parsedProgramId,
          details: {
            machineName: machine.name,
            programName: program.name,
            durationMin: program.durationMin,
            price: program.price,
            type: machine.type
          }
        }
      });
      return { success: true, message: `Transaction for ${machine.name} initiated` };
    } catch (err) {
      console.error("❌ [Backend] Error triggering POS:", err);
      return { success: false, error: "Internal Server Error" };
    }
  }, {
    body: t.Object({
      machineId: t.Union([t.Number(), t.String()]),
      programId: t.Union([t.Number(), t.String()])
    })
  })
  .ws('/ws', {
    open(ws) {
      console.log('🚀 WebSocket connection opened')
      activeConnections.add(ws);

      // Replay last POS status if available
      if (lastPosStatus) {
        console.log('🔄 [Backend] Replaying last POS status to new connection');
        ws.send(lastPosStatus);
      }

      prisma.user.findMany().then(users => {
        ws.send({ type: 'users', data: users })
      })
    },
    message(ws, message: any) {
      console.log('📩 [Backend] WebSocket message received:', typeof message, message)

      let data = message;
      if (typeof message === 'string') {
        try {
          data = JSON.parse(message);
        } catch (e) {
          // It's just a plain string message
        }
      }

      if (data === 'refresh' || data?.type === 'refresh') {
        prisma.user.findMany().then(users => {
          ws.send({ type: 'users', data: users })
        })
      }

      if (data === 'refreshMachines' || data?.type === 'refreshMachines') {
        prisma.machine.findMany().then(machines => {
          ws.send({ type: 'machines', data: machines })
        })
      }

      if (data === 'refreshPrograms' || data?.type === 'refreshPrograms') {
        prisma.program.findMany().then(programs => {
          ws.send({ type: 'programs', data: programs })
        })
      }

      // Control POS Terminal Simulator Worker
      if (data?.type === 'startPayment') {
        console.log('💳 [Backend] Starting payment transaction...');
        posWorker.postMessage({ type: 'START_TRANSACTION', payload: data.payload });
      }
      if (data?.type === 'confirmPayment') {
        console.log('💰 [Backend] User confirmed payment at POS terminal');
        posWorker.postMessage({ type: 'CONFIRM_PAYMENT' });
      }
      if (data === 'posReset' || data?.type === 'posReset') {
        console.log('🔄 [Backend] Sending POS reset command to worker.');
        posWorker.postMessage({ type: 'RESET' });
      }
    },
    close(ws) {
      console.log('❌ WebSocket connection closed')
      activeConnections.delete(ws);
    }
  })
  .listen({
    port: 3000,
    hostname: '0.0.0.0'
  });

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app


