import React, { useState, useEffect } from "react";
import "./form.css";

const estadoInicial = {
  nombre: "",
  telefono: "",
  email: "",
  servicio: "",
  fecha: "",
  hora: "",
  notas: "",
};

export function formularioDeRegistro() {
  const [datos, setDatos] = useState(estadoInicial);
  const [citaAgendada, setCitaAgendada] = useState(false);

  useEffect(() => {
    if (!citaAgendada) return;
    const temporizador = setTimeout(() => setCitaAgendada(false), 4000);
    return () => clearTimeout(temporizador);
  }, [citaAgendada]);

  function manejarCambio(evento) {
    const { name, value } = evento.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
  }

  function manejarEnvio(evento) {
    evento.preventDefault();
    setCitaAgendada(true);
    setDatos(estadoInicial);
  }

  return (
    <div className="contenedor-formulario">
      <h1 className="titulo">Viva Spa</h1>
      <p className="subtitulo">Agenda tu cita de belleza</p>

      {citaAgendada && (
        <div className="mensaje-exito">
          ¡Cita agendada con éxito! Te esperamos en Viva Spa.
        </div>
      )}

      <form className="formulario" onSubmit={manejarEnvio}>
        <label htmlFor="nombre">Nombre completo</label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          placeholder="Ej: Maria Perez"
          value={datos.nombre}
          onChange={manejarCambio}
          required
        />

        <label htmlFor="telefono">Teléfono</label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          placeholder="Ej: 3001234567"
          value={datos.telefono}
          onChange={manejarCambio}
          required
        />

        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Ej: maria@correo.com"
          value={datos.email}
          onChange={manejarCambio}
          required
        />

        <label htmlFor="servicio">Servicio</label>
        <select
          id="servicio"
          name="servicio"
          value={datos.servicio}
          onChange={manejarCambio}
          required
        >
          <option value="">Selecciona un servicio</option>
          <option value="Corte de cabello">Corte de cabello</option>
          <option value="Manicure">Manicure</option>
          <option value="Pedicure">Pedicure</option>
          <option value="Facial">Facial</option>
          <option value="Masaje relajante">Masaje relajante</option>
          <option value="Maquillaje">Maquillaje</option>
          <option value="Tratamiento capilar">Tratamiento capilar</option>
        </select>

        <label htmlFor="fecha">Fecha</label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          value={datos.fecha}
          onChange={manejarCambio}
          required
        />

        <label htmlFor="hora">Hora</label>
        <input
          id="hora"
          name="hora"
          type="time"
          value={datos.hora}
          onChange={manejarCambio}
          required
        />

        <label htmlFor="notas">Notas adicionales (opcional)</label>
        <textarea
          id="notas"
          name="notas"
          placeholder="Cuéntanos algo más sobre tu cita"
          value={datos.notas}
          onChange={manejarCambio}
          rows={3}
        />

        <button type="submit">Agendar cita</button>
      </form>
    </div>
  );
}
