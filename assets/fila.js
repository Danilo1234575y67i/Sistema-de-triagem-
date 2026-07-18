class QueueController {
  constructor(state, dom, priorityLabels, priorityColor, callbacks) {
    this.state = state;
    this.dom = dom;
    this.priorityLabels = priorityLabels;
    this.priorityColor = priorityColor;
    this.callbacks = callbacks;
  }

  init() {
    this.dom.callNext.addEventListener("click", () => this.callNext());
    this.dom.toggleAttendance?.addEventListener("click", () => this.toggleAttendancePanel());
  }

  toggleAttendancePanel() {
    if (!this.dom.attendancePanel) {
      return;
    }
    const isHidden = this.dom.attendancePanel.hidden;
    this.dom.attendancePanel.hidden = !isHidden;
    this.dom.toggleAttendance.textContent = isHidden ? "Ocultar atendimento" : "Mostrar atendimento";
    if (!isHidden) {
      this.renderAttendanceSummary();
    }
  }

  callNext() {
    if (this.state.triages.length === 0) {
      return;
    }
    const called = this.state.triages.shift();
    const patient = this.state.patients.find((item) => item.id === called.patientId);
    this.state.attendanceHistory.unshift({
      ...called,
      patientName: patient ? this.state.getPatientName(patient) : "Paciente não encontrado"
    });
    this.state.attendanceHistory = this.state.attendanceHistory.slice(0, 6);
    window.alert(`${patient ? this.state.getPatientName(patient) : "Paciente"} encaminhado para atendimento.`);
    this.state.save();
    this.callbacks.renderAll();
  }

  render() {
    if (this.state.triages.length === 0) {
      this.dom.queueBoard.innerHTML = `<div class="empty-state">Nenhum paciente aguardando atendimento.</div>`;
    } else {
      this.dom.queueBoard.innerHTML = this.state.triages.map((triage) => {
        const patient = this.state.patients.find((item) => item.id === triage.patientId);
        const patientName = patient ? this.state.getPatientName(patient) : "Paciente não encontrado";
        return `
          <article class="queue-card">
            <div class="risk-bar" style="background:${this.priorityColor[triage.classification]}"></div>
            <div class="queue-body">
              <header>
                <div>
                  <strong>${patientName}</strong>
                  <small>Entrada ${triage.time}</small>
                </div>
                <span class="tag ${triage.classification}">${this.priorityLabels[triage.classification]}</span>
              </header>
              <div class="tag-row">
                <span class="tag">PA ${triage.bloodPressure}</span>
                <span class="tag">Temp ${triage.temperature} °C</span>
                <span class="tag">SpO2 ${triage.oxygen}%</span>
              </div>
              <p class="meta-line">${triage.symptoms}</p>
            </div>
          </article>
        `;
      }).join("");
    }
    this.renderAttendanceSummary();
  }

  renderAttendanceSummary() {
    if (!this.dom.attendanceSummary) {
      return;
    }
    if (this.state.attendanceHistory.length === 0) {
      this.dom.attendanceSummary.innerHTML = `<div class="empty-state">Nenhum paciente encaminhado para atendimento ainda.</div>`;
      return;
    }
    this.dom.attendanceSummary.innerHTML = this.state.attendanceHistory.map((item, index) => {
      const label = index === 0 ? "Em atendimento" : "Recentes";
      return `
        <article class="attendance-card">
          <div class="attendance-head">
            <strong>${item.patientName}</strong>
            <span class="tag ${item.classification}">${this.priorityLabels[item.classification]}</span>
          </div>
          <div class="attendance-meta">${label} · ${item.time}</div>
          <div class="attendance-meta">${item.symptoms}</div>
        </article>
      `;
    }).join("");
  }

  render() {
    if (this.state.triages.length === 0) {
      this.dom.queueBoard.innerHTML = `<div class="empty-state">Nenhum paciente aguardando atendimento.</div>`;
    } else {
      this.dom.queueBoard.innerHTML = this.state.triages.map((triage) => {
        const patient = this.state.patients.find((item) => item.id === triage.patientId);
        const patientName = patient ? this.state.getPatientName(patient) : "Paciente não encontrado";
        return `
          <article class="queue-card">
            <div class="risk-bar" style="background:${this.priorityColor[triage.classification]}"></div>
            <div class="queue-body">
              <header>
                <div>
                  <strong>${patientName}</strong>
                  <small>Entrada ${triage.time}</small>
                </div>
                <span class="tag ${triage.classification}">${this.priorityLabels[triage.classification]}</span>
              </header>
              <div class="tag-row">
                <span class="tag">PA ${triage.bloodPressure}</span>
                <span class="tag">Temp ${triage.temperature} °C</span>
                <span class="tag">SpO2 ${triage.oxygen}%</span>
              </div>
              <p class="meta-line">${triage.symptoms}</p>
            </div>
          </article>
        `;
      }).join("");
    }
    this.renderAttendanceSummary();
  }
}

window.QueueController = QueueController;
