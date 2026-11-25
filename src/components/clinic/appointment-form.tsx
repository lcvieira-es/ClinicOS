'use client';

import { useActionState, useState, useMemo, useEffect } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { createAppointmentAction, checkSlotAvailabilityAction } from '@/lib/clinic/actions/agenda';
import type { ClinicFormState } from '@/lib/clinic/form-state';
import type { ProfessionalSchedule } from '@/lib/clinic/disponibilidade';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';

interface Option {
  id: string;
  name: string;
}

interface Professional {
  id: string;
  name: string;
  specialties: string[];
}

interface BusySlot {
  professional_id: string;
  scheduled_start: string;
  scheduled_end: string;
}

interface LockedPatient {
  id: string;
  name: string;
}

export function AppointmentForm({
  patients,
  professionals,
  units,
  schedules,
  busySlots,
  action = createAppointmentAction,
  lockedPatient,
}: {
  patients: Option[];
  professionals: Professional[];
  units: Option[];
  schedules: ProfessionalSchedule[];
  busySlots: BusySlot[];
  action?: (prev: ClinicFormState, formData: FormData) => Promise<ClinicFormState>;
  lockedPatient?: LockedPatient;
}) {
  const [state, formAction, pending] = useActionState<ClinicFormState, FormData>(
    action,
    {},
  );
  const [availError, setAvailError] = useState('');
  const [availPending, setAvailPending] = useState(false);
  const runAvailabilityCheck = (profId: string, date: string, time: string) => {
    if (!profId || !date || !time) {
      setAvailError('');
      return;
    }
    const start = new Date(date + 'T' + time + ':00-03:00');
    const end = new Date(start.getTime() + 30 * 60_000);
    const localConflict = (busySlots || []).some((bs) => {
      if (bs.professional_id !== profId) return false;
      const bsStart = new Date(String(bs.scheduled_start).slice(0, 10) + 'T' + String(bs.scheduled_start).slice(11, 16) + ':00Z');
      const bsEnd = new Date(String(bs.scheduled_end).slice(0, 10) + 'T' + String(bs.scheduled_end).slice(11, 16) + ':00Z');
      return bsStart < end && bsEnd > start;
    });
    if (localConflict) {
      setAvailError('Horário ocupado para este profissional');
    } else {
      setAvailError('');
    }
    const fd = new FormData();
    fd.set('professionalId', profId);
    fd.set('date', date);
    fd.set('time', time);
    fd.set('durationMin', '30');
    void (async () => {
      try {
        const result = await checkSlotAvailabilityAction({}, fd);
        setAvailError(result.error ?? '');
      } catch {
        // keep local result
      }
    })();
  };

  const [specialty, setSpecialty] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const specialties = useMemo(() => {
    const set = new Set<string>();
    professionals.forEach((p) => (p.specialties || []).forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [professionals]);

  const filteredProfessionals = useMemo(() => {
    if (!specialty) return professionals;
    return professionals.filter((p) => (p.specialties || []).includes(specialty));
  }, [professionals, specialty]);

  const profSchedules = useMemo(
    () => schedules.filter((s) => s.professional_id === professionalId),
    [schedules, professionalId],
  );

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  useEffect(() => {
    if (!professionalId || profSchedules.length === 0) {
      setAvailableDates([]);
      return;
    }
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const weekday = d.getDay();
      if (profSchedules.some((s) => s.weekday === weekday)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${dd}`);
      }
    }
    setAvailableDates(dates);
  }, [professionalId, profSchedules]);

  // Available times for selected date
  const availableTimes = useMemo(() => {
    if (!professionalId || !selectedDate) return [];
    const d = new Date(`${selectedDate}T12:00:00`);
    const weekday = d.getDay();
    const daySchedules = profSchedules.filter((s) => s.weekday === weekday);
    if (daySchedules.length === 0) return [];

    const busy = busySlots.filter((b) => b.professional_id === professionalId);
    const times: string[] = [];
    for (const sched of daySchedules) {
      const [sh, sm] = sched.start_time.split(':').map(Number);
      const [eh, em] = sched.end_time.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      const slot = sched.slot_minutes || 30;
      for (let m = startMin; m + slot <= endMin; m += slot) {
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        const timeStr = `${hh}:${mm}`;
        const slotStart = new Date(`${selectedDate}T${timeStr}:00`);
        const slotEnd = new Date(slotStart.getTime() + slot * 60_000);
        // check busy
        const isBusy = busy.some((b) => {
          const bs = new Date(String(b.scheduled_start).replace(' ', 'T').replace(/\+00(:00)?$/, 'Z'));
          const be = new Date(String(b.scheduled_end).replace(' ', 'T').replace(/\+00(:00)?$/, 'Z'));
          return slotStart < be && slotEnd > bs;
        });
        if (!isBusy) times.push(timeStr);
      }
    }
    return Array.from(new Set(times)).sort();
  }, [professionalId, selectedDate, profSchedules, busySlots]);

  return (
    <form action={formAction} className="space-y-5">
      {lockedPatient ? (
        <input type="hidden" name="patientId" value={lockedPatient.id} />
      ) : null}

      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-danger-soft/60 px-4 py-3 text-xs font-medium text-red-700" role="alert">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-xl border border-emerald-200 bg-success-soft/60 px-4 py-3 text-xs font-medium text-emerald-700" role="status">
          {state.success}
        </div>
      ) : null}

      <Card>
        <CardHeader title="Agendamento" description="Paciente, especialidade, profissional e horário." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Paciente *" htmlFor="patientId" className="sm:col-span-2">
            {lockedPatient ? (
              <Input id="patientId" value={lockedPatient.name} readOnly className="bg-sky-50" />
            ) : (
              <Select id="patientId" name="patientId" required defaultValue="">
                <option value="" disabled>
                  Selecione…
                </option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Especialidade" htmlFor="specialty">
            <Select
              id="specialty"
              value={specialty}
              onChange={(e) => {
                setSpecialty(e.target.value);
                setProfessionalId('');
                setSelectedDate('');
                setSelectedTime('');
                setAvailError('');
              }}
            >
              <option value="">Todas</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Profissional *" htmlFor="professionalId">
            <Select
              id="professionalId"
              name="professionalId"
              required
              value={professionalId}
              onChange={(e) => {
                setProfessionalId(e.target.value);
                setSelectedDate('');
                setSelectedTime('');
                setAvailError('');
              }}
            >
              <option value="" disabled>
                Selecione…
              </option>
              {filteredProfessionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Unidade *" htmlFor="unitId">
            <Select id="unitId" name="unitId" required defaultValue="">
              <option value="" disabled>
                Selecione…
              </option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Data *" htmlFor="date">
            {availableDates.length > 0 ? (
              <Select
                id="date"
                name="date"
                required
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime('');
                  setAvailError('');
                }}
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d.split('-').reverse().join('/')}
                  </option>
                ))}
              </Select>
            ) : (
              <Input id="date" name="date" type="date" required defaultValue="" onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); setAvailError(''); }} />
            )}
          </Field>

          <Field label="Horário *" htmlFor="time">
            <div className={availError ? "relative rounded-xl border border-red-500 shadow-[0_0_0_3px_rgba(220,38,38,0.3)]" : "relative"}>
              {availableTimes.length > 0 ? (
                <Select
                  id="time"
                  name="time"
                  required
                  value={selectedTime}
                  onChange={(e) => {
                    const t = e.target.value;
                    setSelectedTime(t);
                    runAvailabilityCheck(professionalId, selectedDate, t);
                  }}
                >
                  <option value="" disabled>
                    Selecione…
                  </option>
                  {availableTimes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input id="time" name="time" type="time" required defaultValue="09:00" onChange={(e) => { const t = e.target.value; setSelectedTime(t); runAvailabilityCheck(professionalId, selectedDate, t); }} />
              )}
              {availError ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-red-500/10 text-xs font-medium text-red-700">
                  {availError}
                </div>
              ) : null}
            </div>
          </Field>

          <Field label="Tipo" htmlFor="type">
            <Select id="type" name="type" defaultValue="consulta">
              <option value="consulta">Consulta</option>
              <option value="procedimento">Procedimento</option>
              <option value="teleconsulta">Teleconsulta</option>
              <option value="avaliacao">Avaliação</option>
            </Select>
          </Field>

          <Field label="Observações" htmlFor="notes" className="sm:col-span-2">
            <Input id="notes" name="notes" placeholder="Motivo, observações…" />
          </Field>
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={pending || !!availError} size="md">
          {pending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2} />
              Agendando…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" strokeWidth={2} />
              Criar agendamento
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
