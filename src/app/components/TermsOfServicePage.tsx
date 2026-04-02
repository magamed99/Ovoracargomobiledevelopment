import { ArrowLeft, FileText, AlertTriangle, CheckCircle, XCircle, Scale, Users } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTheme } from '../context/ThemeContext';

export function TermsOfServicePage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bg  = isDark ? 'bg-[#0e1621]' : 'bg-white';
  const txt = isDark ? 'text-white'    : 'text-[#0f172a]';
  const sub = isDark ? 'text-[#6b7f94]' : 'text-[#94a3b8]';
  const div = isDark ? 'border-[#1e2d3d]' : 'border-[#f0f2f5]';
  const hdr = isDark ? 'bg-[#0e1621]/95 border-[#1e2d3d]' : 'bg-white/95 border-[#e8eaed]';

  const sections = [
    {
      icon: CheckCircle,
      title: '1. Принятие условий',
      color: 'text-emerald-500',
      content: [
        'Используя платформу Ovora Cargo, вы принимаете настоящие Условия использования',
        'Если вы не согласны с условиями, пожалуйста, не используйте наш сервис',
        'Мы можем изменять условия в любое время',
        'Продолжение использования после изменений означает ваше согласие',
      ],
    },
    {
      icon: Users,
      title: '2. Учетная запись',
      color: 'text-blue-500',
      content: [
        'Вы должны быть старше 18 лет для использования платформы',
        'Вы обязаны предоставить точную и актуальную информацию',
        'Вы несете ответственность за безопасность своей учетной записи',
        'Запрещается создавать несколько аккаунтов',
        'Запрещается передавать доступ к аккаунту третьим лицам',
        'Мы можем приостановить или удалить ваш аккаунт при нарушении условий',
      ],
    },
    {
      icon: FileText,
      title: '3. Правила для водителей',
      color: 'text-purple-500',
      content: [
        'Водитель обязан иметь действующие права и документы на автомобиль',
        'Водитель несет ответственность за безопасность груза',
        'Водитель обязан соблюдать правила дорожного движения',
        'Водитель должен предоставлять точную информацию о поездке',
        'Запрещается отменять поездку менее чем за 2 часа до отправления',
        'Водитель обязан поддерживать чистоту и исправность автомобиля',
      ],
    },
    {
      icon: FileText,
      title: '4. Правила для отправителей',
      color: 'text-amber-500',
      content: [
        'Отправитель обязан точно описывать груз',
        'Запрещается отправлять запрещенные и опасные грузы',
        'Отправитель несет ответственность за содержимое груза',
        'Отправитель обязан своевременно оплачивать услуги',
        'Запрещается отменять заявку менее чем за 1 час до отправления',
      ],
    },
    {
      icon: XCircle,
      title: '5. Запрещенные действия',
      color: 'text-rose-500',
      content: [
        'Мошенничество и обман других пользователей',
        'Использование платформы для незаконной деятельности',
        'Перевозка запрещенных товаров (наркотики, оружие и т.д.)',
        'Оскорбления, угрозы, дискриминация других пользователей',
        'Размещение ложной информации',
        'Использование автоматических средств (ботов) без разрешения',
        'Попытки взлома или нарушения работы платформы',
      ],
    },
    {
      icon: Scale,
      title: '6. Платежи и комиссия',
      color: 'text-indigo-500',
      content: [
        '🎉 ПЛАТФОРМА ПОЛНОСТЬЮ БЕСПЛАТНА для всех пользователей',
        'Платежи производятся НАПРЯМУЮ между водителем и отправителем',
        'Способы оплаты: наличные при встрече или банковский перевод',
        'Ovora Cargo НЕ берёт комиссию за поездки',
        'Ovora Cargo НЕ обрабатывает платежи',
        'Ovora Cargo НЕ является стороной финансовой сделки',
        'Мы не несем ответственности за споры по оплате между пользователями',
        'Водители сами устанавливают цены за свои услуги',
      ],
    },
    {
      icon: AlertTriangle,
      title: '7. Ограничение ответственности',
      color: 'text-orange-500',
      content: [
        'Ovora Cargo является платформой-агрегатором',
        'Мы не несем ответственности за действия водителей и отправителей',
        'Мы не гарантируем качество и своевременность услуг',
        'Мы не несем ответственности за утерю или повреждение груза',
        'Вы используете платформу на свой собственный риск',
        'Максимальная ответственность ограничена суммой последней транзакции',
      ],
    },
  ];

  return (
    <div className={`min-h-screen ${bg} pb-20 font-['Sora']`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b ${hdr}`}>
        <button
          onClick={() => navigate(-1)}
          className={`w-8 h-8 flex items-center justify-center transition-colors ${
            isDark ? 'text-[#8a9bb0] hover:text-white' : 'text-[#6b7280] hover:text-[#0f172a]'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`text-[16px] font-bold flex-1 ${txt}`}>Условия использования</h1>
      </header>

      {/* Hero */}
      <div className={`px-4 py-5 border-b ${div} flex items-center gap-3`}>
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#1978e5,#0d4d99)', borderRadius: 12 }}>
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className={`text-[15px] font-bold ${txt}`}>Условия использования Ovora Cargo</p>
          <p className={`text-[11px] mt-0.5 ${sub}`}>Версия 1.0 · Вступила в силу: 1 января 2024 г.</p>
        </div>
      </div>

      {/* Intro */}
      <div className={`px-4 py-4 border-b ${div}`}>
        <p className={`text-[13px] leading-relaxed ${sub}`}>
          Настоящие Условия регулируют ваш доступ к платформе <span className={`font-semibold ${txt}`}>Ovora Cargo</span> и использование наших услуг. Платформа предоставляется компанией Ovora Cargo LLC, зарегистрированной в Республике Таджикистан.
        </p>
        <p className={`text-[13px] leading-relaxed mt-2 ${sub}`}>
          Принимая эти Условия, вы заключаете юридически обязывающее соглашение с нами.
        </p>
      </div>

      {/* Important Notice */}
      <div className={`px-4 py-4 border-b border-l-2 border-l-amber-400 ${div}`}>
        <div className="flex items-start gap-2">
          <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
          <div>
            <p className={`text-[13px] font-semibold mb-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Важно знать</p>
            <p className={`text-[12px] leading-relaxed ${sub}`}>
              Ovora Cargo является <span className={`font-semibold ${txt}`}>платформой-посредником</span>, соединяющей водителей и отправителей. Мы не предоставляем транспортные услуги напрямую. Все соглашения заключаются непосредственно между водителем и отправителем.
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, idx) => {
        const Icon = section.icon;
        return (
          <div key={idx} className={`border-b ${div}`}>
            <div className={`px-4 py-4 flex items-center gap-3`}>
              <Icon className={`w-4 h-4 flex-shrink-0 ${section.color}`} />
              <p className={`text-[14px] font-semibold ${txt}`}>{section.title}</p>
            </div>
            <ul className={`px-4 pb-4 space-y-2 pl-11`}>
              {section.content.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className={`w-1 h-1 rounded-full mt-2 flex-shrink-0 ${isDark ? 'bg-[#3d5263]' : 'bg-[#cbd5e1]'}`} />
                  <span className={`text-[12.5px] leading-relaxed ${sub}`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {/* Dispute Resolution */}
      <div className={`px-4 py-4 border-b ${div}`}>
        <p className={`text-[14px] font-semibold mb-3 ${txt}`}>8. Разрешение споров</p>
        <div className={`space-y-2 text-[12.5px] ${sub}`}>
          <p>При возникновении споров между пользователями, мы рекомендуем сначала попытаться решить вопрос мирным путем через переговоры.</p>
          <p>Если разрешить спор не удается, вы можете обратиться в нашу службу поддержки. Мы постараемся помочь в качестве посредника, но окончательное решение остается за сторонами.</p>
          <p>Все споры, которые не могут быть разрешены мирным путем, подлежат рассмотрению в судах Республики Таджикистан.</p>
        </div>
      </div>

      {/* Updates */}
      <div className={`px-4 py-4 border-b ${div}`}>
        <p className={`text-[14px] font-semibold mb-2 ${txt}`}>9. Изменения условий</p>
        <p className={`text-[12.5px] leading-relaxed ${sub}`}>
          Мы можем периодически обновлять настоящие Условия. О существенных изменениях мы уведомим вас через приложение или email. Продолжая использовать платформу после изменений, вы соглашаетесь с новыми условиями.
        </p>
      </div>

      {/* Contact */}
      <div className={`px-4 py-4 border-b ${div}`}>
        <p className={`text-[14px] font-semibold mb-3 ${txt}`}>Вопросы по условиям?</p>
        <div className={`space-y-1.5 text-[12.5px] ${sub}`}>
          <div>📧 Email: legal@ovoracargo.tj</div>
          <div>📞 Телефон: +992 (92) 777-00-00</div>
          <div>📍 Адрес: г. Душанбе, ул. Рудаки, 95</div>
        </div>
        <button
          onClick={() => navigate('/contact')}
          className="mt-3 text-[13px] font-semibold text-[#1978e5] transition-opacity active:opacity-60"
        >
          Связаться с нами →
        </button>
      </div>

      {/* Agreement */}
      <div className={`px-4 py-4`}>
        <p className={`text-[12.5px] font-semibold mb-2 ${txt}`}>Используя Ovora Cargo, вы подтверждаете, что:</p>
        <ul className={`space-y-1 text-[12px] ${sub}`}>
          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> Вам исполнилось 18 лет</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> Вы прочитали и поняли настоящие Условия</li>
          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> Вы согласны соблюдать эти Условия</li>
        </ul>
      </div>
    </div>
  );
}
