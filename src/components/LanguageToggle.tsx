import { useTranslation } from 'react-i18next'

const RoFlag = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" className="w-5 h-auto rounded-[1px] shadow-sm border border-border/20">
        <path fill="#002B7F" d="M0 0h1v2H0z" />
        <path fill="#FCD116" d="M1 0h1v2H1z" />
        <path fill="#CE1126" d="M2 0h1v2H2z" />
    </svg>
)

const EnFlag = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="w-5 h-auto rounded-[1px] shadow-sm border border-border/20">
        <clipPath id="uk-clip">
            <path d="M0,0 v30 h60 v-30 z" />
        </clipPath>
        <clipPath id="uk-crosses">
            <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
        </clipPath>
        <g clipPath="url(#uk-clip)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-crosses)" stroke="#C8102E" strokeWidth="4" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
        </g>
    </svg>
)

export function LanguageToggle() {
    const { i18n, t } = useTranslation()
    const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'ro' ? 'en' : 'ro')

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center justify-center px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-sm font-bold gap-2"
            title={t('Select Language')}
        >
            {i18n.language === 'ro' ? (
                <><EnFlag /> EN</>
            ) : (
                <><RoFlag /> RO</>
            )}
        </button>
    )
}
