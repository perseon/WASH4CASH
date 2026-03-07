import { Elysia, t } from "elysia";
import { cors } from '@elysiajs/cors'
import { prisma } from "./lib/prisma";

// --- POS TERMINAL SIMULATOR ---
const posWorker = new Worker(new URL('./simulated/pos_term.ts', import.meta.url).href);

// Store WebSocket connections to broadcast POS updates
const activeConnections = new Set<any>();

posWorker.onmessage = (event) => {
  const { type, payload } = event.data;
  console.log(`📡 [Backend] Message from POS Worker:`, type, JSON.stringify(payload));

  if (activeConnections.size === 0) {
    console.warn("⚠️ [Backend] No active WebSocket connections to broadcast to");
  }

  // Broadcast to all active WebSocket clients
  for (const ws of activeConnections) {
    ws.send({ type: 'pos_update', data: { type, payload } });
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

    worker.postMessage({ type: 'INIT', payload: { id: m.id, status: m.status } });

    worker.onmessage = async (event) => {
      const { type, payload } = event.data;
      if (type === 'MACHINE_STATE') {
        const { machineId, status, remainingTime } = payload;

        // Update DB
        await prisma.machine.update({
          where: { id: machineId },
          data: { status }
        });

        // Broadcast to clients
        for (const ws of activeConnections) {
          ws.send({ type: 'machine_update', data: payload });
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
  .get("/trigger-pos", ({ query }) => {
    const amount = parseFloat(query.amount || "10.00");
    const serviceName = query.serviceName || "Washing Machine #1 - Quick Wash";
    console.log(`🔌 [Backend] Internally triggering POS transaction for $${amount} (${serviceName})`);
    posWorker.postMessage({ type: 'START_TRANSACTION', payload: { amount, currency: 'USD', serviceName } });
    return { success: true, message: `Transaction for ${serviceName} ($${amount}) initiated` };
  })
  .ws('/ws', {
    open(ws) {
      console.log('🚀 WebSocket connection opened')
      activeConnections.add(ws);
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
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app