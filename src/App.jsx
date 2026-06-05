import { useState, useEffect } from 'react'
import {
  createCard, getContact, findCardByContact,
  updateCardStep, addCardNote, scheduleClinicorp, fetchClinicorpSlots
} from './api'
import { UNITS, CRC_LIST, UNIT_LIST } from './config'
import './App.css'

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  return days
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isPhonePrivate(phone) {
  if (!phone) return true
  const str = String(phone)
  if (str.includes('@')) return true
  const digits = str.replace(/\D/g, '')
  if (digits.length < 10) return true
  return false
}

function getStepName(stepId) {
  for (const unit of Object.values(UNITS)) {
    if (unit.STEP_AGENDADO === stepId) return unit.STEP_NAME
  }
  return 'Outra etapa'
}

function App() {
  const today = new Date()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  const [step, setStep] = useState(1)

  // Dados do paciente
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [phonePrivate, setPhonePrivate] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [crc, setCrc] = useState('rita')
  const [unidade, setUnidade] = useState('bueno')

  // Contato / card
  const [contactId, setContactId] = useState(null)
  const [existingCard, setExistingCard] = useState(null)

  // Calendário
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)

  // Submit
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  // Carrega dados do contato a partir do parâmetro na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const cid = params.get('contactid') || params.get('contactId')
    if (!cid) return
    setContactId(cid)
    getContact(cid)
      .then(data => {
        if (data?.name) setNome(data.name)
        const phone = data?.phone || data?.phoneNumber || data?.mobilePhone || ''
        const priv = isPhonePrivate(phone)
        setPhonePrivate(priv)
        if (!priv) setTelefone(phone)
      })
      .catch(err => console.warn('Erro ao carregar contato:', err))
  }, [])

  // Verifica se já existe card na unidade selecionada
  useEffect(() => {
    if (!contactId) return
    findCardByContact(contactId, unidade)
      .then(card => setExistingCard(card || null))
      .catch(() => setExistingCard(null))
  }, [contactId, unidade])

  // Busca horários quando data ou unidade muda
  useEffect(() => {
    if (!selectedDate) return
    setSlotsLoading(true)
    setSlotsError(null)
    setSelectedSlot(null)
    setAvailableSlots([])
    fetchClinicorpSlots(selectedDate, unidade)
      .then(slots => setAvailableSlots(slots))
      .catch(err => setSlotsError(err.message))
      .finally(() => setSlotsLoading(false))
  }, [selectedDate, unidade])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const handleDayClick = (day) => {
    const dateStr = toDateStr(viewYear, viewMonth, day)
    if (dateStr < todayStr) return
    setSelectedDate(dateStr)
    setSelectedSlot(null)
  }

  const handleNext = (e) => {
    e.preventDefault()
    if (!nome.trim()) return
    if (phonePrivate && !telefone.trim()) return
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault()
    if (!nome.trim()) return
    setLoading(true)
    setMessage(null)

    try {
      const crcLabel = CRC_LIST.find(c => c.key === crc)?.label || crc
      const unitCfg = UNITS[unidade]
      const stepId = unitCfg.STEP_AGENDADO
      const panelId = unitCfg.PANEL_ID
      const labelId = unitCfg.LABELS[crc]
      const notesText = `Agendado pela ${crcLabel}`

      let extraInfo = []
      if (selectedDate && selectedSlot) {
        extraInfo.push(`Agendamento: ${selectedDate} às ${selectedSlot.from}`)
      }
      let finalDescription = descricao.trim()
      if (extraInfo.length > 0) {
        finalDescription = extraInfo.join('\n') + (finalDescription ? `\n\nObservações:\n${finalDescription}` : '')
      }

      let card = existingCard
      if (!card && contactId) {
        card = await findCardByContact(contactId, unidade).catch(() => null)
      }

      const dueDateTime = selectedDate && selectedSlot ? `${selectedDate}T${selectedSlot.from}:00` : null

      if (card) {
        await updateCardStep(card.id, stepId, dueDateTime, labelId)
        if (finalDescription) await addCardNote(card.id, finalDescription)
      } else {
        await createCard(stepId, nome.trim(), finalDescription, contactId, dueDateTime, panelId, labelId)
      }

      let clinicorpStatus = null
      if (selectedDate && selectedSlot) {
        try {
          await scheduleClinicorp({
            patientName: nome.trim(),
            patientPhone: telefone,
            dentistId: selectedSlot.professionalId,
            dateLocal: selectedDate,
            fromTime: selectedSlot.from,
            toTime: selectedSlot.to,
            notes: notesText,
            unit: unidade,
          })
          clinicorpStatus = 'ok'
        } catch (err) {
          clinicorpStatus = err.message
        }
      }

      const baseText = card ? 'Card atualizado com sucesso!' : 'Card criado com sucesso!'
      if (clinicorpStatus === 'ok') {
        setMessage({ type: 'success', text: `${baseText} Agendamento no Clinicorp confirmado.` })
      } else if (clinicorpStatus) {
        setMessage({ type: 'error', text: `${baseText}\n\nErro no Clinicorp: ${clinicorpStatus}\n\nVerifique o console do navegador (F12) para mais detalhes.` })
      } else {
        setMessage({ type: 'success', text: baseText })
      }

      setStep(1)
      setSelectedDate(null)
      setSelectedSlot(null)
      setAvailableSlots([])
      setDescricao('')
      setCrc('rita')
      setUnidade('bueno')
      setExistingCard(null)
      const timeout = clinicorpStatus && clinicorpStatus !== 'ok' ? 12000 : 6000
      setTimeout(() => setMessage(null), timeout)
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const calendarDays = buildCalendarDays(viewYear, viewMonth)
  const unitProfessionals = UNITS[unidade].PROFESSIONALS
  const selectedProf = selectedSlot
    ? unitProfessionals.find(p => p.id === selectedSlot.professionalId)
    : null

  const phoneInvalid = phonePrivate && !telefone.trim()
  const unidadeLabel = UNIT_LIST.find(u => u.key === unidade)?.label || unidade

  return (
    <div className="page">
      <header className="header">
        <div className="brand">
          <div className="brand-mark"><span className="brand-initials brand-initials-sm">IBS</span></div>
          <div className="brand-text">
            <h1 className="brand-name">IBS Agendamentos</h1>
            <p className="brand-sub">Criação Rápida de Cards no CRM</p>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="form-container">

          {/* Alert */}
          {message && (
            <div className={`alert alert-${message.type}`}>
              {message.type === 'success' ? (
                <div className="alert-inner">
                  <span className="alert-icon alert-icon-success">✓</span>
                  <span>{message.text}</span>
                </div>
              ) : message.type === 'warning' ? (
                <div className="alert-inner">
                  <span className="alert-icon alert-icon-warning">⚠</span>
                  <span>{message.text}</span>
                </div>
              ) : message.text}
            </div>
          )}

          {/* ── ETAPA 1: Formulário ── */}
          {step === 1 && (
            <div className="step-content">
              <div className="form-header">
                <h3>{existingCard ? 'Atualizar Agendamento' : 'Novo Agendamento'}</h3>
                <p>
                  {existingCard
                    ? 'Card encontrado — será movido para a etapa Agendado.'
                    : 'Preencha os dados para criar o card no CRM.'}
                </p>
                {existingCard && (
                  <div className="card-preview">
                    <div className="card-preview-row">
                      <span className="card-preview-label">Etapa atual</span>
                      <span className="card-preview-value">{getStepName(existingCard.stepId)}</span>
                    </div>
                    {existingCard.title && (
                      <div className="card-preview-row">
                        <span className="card-preview-label">Título</span>
                        <span className="card-preview-value">{existingCard.title}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <form className="card-form" onSubmit={handleNext}>

                {/* Seção: Dados do paciente */}
                <div className="form-section">
                  <span className="form-section-label">Dados do Paciente</span>

                  <div className="form-group">
                    <label>Nome *</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: João da Silva"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className={phonePrivate ? 'label-required' : ''}>
                      Telefone {phonePrivate && <span className="label-badge-private">Número privado — preencha</span>}
                    </label>
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="Ex: (62) 98765-4321"
                      className={phoneInvalid ? 'input-error' : ''}
                      required={phonePrivate}
                    />
                    {phoneInvalid && (
                      <span className="field-hint-error">
                        O número deste contato é privado. Digite o telefone para continuar.
                      </span>
                    )}
                  </div>
                </div>

                {/* Seção: Card no CRM */}
                <div className="form-section">
                  <span className="form-section-label">Card no CRM</span>

                  <div className="form-group">
                    <label>CRC Responsável</label>
                    <div className="segmented-control">
                      {CRC_LIST.map(item => (
                        <label key={item.key} className={`segment ${crc === item.key ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="crc"
                            value={item.key}
                            checked={crc === item.key}
                            onChange={(e) => setCrc(e.target.value)}
                            className="sr-only"
                          />
                          <span className="segment-text">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Unidade</label>
                    <div className="segmented-control">
                      {UNIT_LIST.map(item => (
                        <label key={item.key} className={`segment ${unidade === item.key ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="unidade"
                            value={item.key}
                            checked={unidade === item.key}
                            onChange={(e) => setUnidade(e.target.value)}
                            className="sr-only"
                          />
                          <span className="segment-text">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Observações</label>
                    <textarea
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Informações adicionais do paciente..."
                      rows="3"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!nome.trim() || phoneInvalid}
                  >
                    Próximo: Escolher Horário →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── ETAPA 2: Calendário ── */}
          {step === 2 && (
            <div className="step-content">
              <div className="form-header">
                <h3>Escolha o melhor horário</h3>
                <p>Agenda Clinicorp — Unidade {unidadeLabel}.</p>
              </div>

              <div className="calendar-wrap">
                <div className="calendar">
                  <div className="cal-header">
                    <button type="button" className="cal-nav" onClick={prevMonth}>&#8249;</button>
                    <div className="cal-month-label">
                      <span>{MONTHS[viewMonth].toUpperCase()}</span>
                      <span className="cal-year">{viewYear}</span>
                    </div>
                    <button type="button" className="cal-nav" onClick={nextMonth}>&#8250;</button>
                  </div>

                  <div className="cal-grid">
                    {WEEKDAYS.map(w => (
                      <div key={w} className="cal-weekday">{w}</div>
                    ))}
                    {calendarDays.map((day, i) => {
                      if (!day) return <div key={`e-${i}`} className="cal-empty" />
                      const dateStr = toDateStr(viewYear, viewMonth, day)
                      const isPast = dateStr < todayStr
                      const isToday = dateStr === todayStr
                      const isSelected = dateStr === selectedDate
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isPast}
                          className={[
                            'cal-day',
                            isPast ? 'cal-day-past' : '',
                            isToday && !isSelected ? 'cal-day-today' : '',
                            isSelected ? 'cal-day-selected' : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => handleDayClick(day)}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {selectedDate && (
                  <div className="slots-section">
                    <div className="slots-header">Horários disponíveis</div>
                    {slotsLoading && (
                      <div className="slots-loading-row">
                        <span className="spinner spinner-dark" />
                        Buscando horários...
                      </div>
                    )}
                    {slotsError && <p className="slots-msg slots-msg-error">⚠ {slotsError}</p>}
                    {!slotsLoading && !slotsError && availableSlots.length === 0 && (
                      <p className="slots-msg">Nenhum horário disponível para esta data.</p>
                    )}
                    {!slotsLoading && availableSlots.length > 0 && (
                      <div className="slots-list">
                        {availableSlots.map((slot, i) => {
                          const prof = unitProfessionals.find(p => p.id === slot.professionalId)
                          const isActive = selectedSlot?.from === slot.from && selectedSlot?.professionalId === slot.professionalId
                          return (
                            <button
                              key={`${slot.from}-${slot.professionalId}-${i}`}
                              type="button"
                              className={`slot-row${isActive ? ' slot-row-active' : ''}`}
                              onClick={() => setSelectedSlot(isActive ? null : slot)}
                            >
                              <span className="slot-row-time">{slot.from} às {slot.to}</span>
                              {prof && <span className="slot-row-prof">{prof.name.split(' ').slice(0, 2).join(' ')}</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedSlot && (
                <div className="slot-summary">
                  ✓ {selectedDate} às {selectedSlot.from}
                  {selectedProf ? ` · ${selectedProf.name.split(' ').slice(0, 2).join(' ')}` : ''}
                </div>
              )}

              <div className="step2-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  ← Voltar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading
                    ? <span className="btn-loading"><span className="spinner" />Salvando...</span>
                    : selectedSlot
                      ? (existingCard ? 'Atualizar Card' : 'Criar Card')
                      : 'Criar Card sem Horário'}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default App
