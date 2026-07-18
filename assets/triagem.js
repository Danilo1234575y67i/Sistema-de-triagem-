class TriageController {
  constructor(state, dom, callbacks, priorityLabels) {
    this.state = state;
    this.dom = dom;
    this.callbacks = callbacks;
    this.priorityLabels = priorityLabels;
    this.suggestedRisk = null;
  }

  init() {
    this.dom.triagePatient.addEventListener("change", () => this.selectPatient());
    ["bloodPressure", "temperature", "oxygen", "heartRate"].forEach((id) => {
      document.getElementById(id).addEventListener("input", () => this.renderVitalPreview());
    });
    this.dom.symptoms?.addEventListener("keydown", (event) => {
      if (/\d/.test(event.key)) {
        event.preventDefault();
      }
    });
    this.dom.symptoms?.addEventListener("input", () => this.sanitizeTextField(this.dom.symptoms));
    this.dom.suggestRisk.addEventListener("click", () => this.suggestRisk());
    this.dom.confirmRiskSuggestion?.addEventListener("click", () => this.confirmSuggestedRisk());
    this.dom.triageForm.addEventListener("submit", (event) => this.handleSubmit(event));
    this.dom.clearTriageForm.addEventListener("click", () => this.reset());
  }

  sanitizeTextField(field) {
    const sanitizedValue = field.value.replace(/\d/g, "");
    if (field.value !== sanitizedValue) {
      field.value = sanitizedValue;
    }
  }

  selectPatient() {
    this.state.selectedPatientId = this.dom.triagePatient.value;
    this.renderPatientSummary();
  }

  parseBloodPressure(value) {
    const parts = value.split("-");
    return {
      systolic: Number(parts[0]),
      diastolic: Number(parts[1])
    };
  }

  normalizeClassification(value) {
    return value || null;
  }

  calculateSuggestion() {
    const pressure = this.parseBloodPressure(document.getElementById("bloodPressure").value);
    const temperature = parseInt(document.getElementById("temperature").value, 10);
    const oxygen = Number(document.getElementById("oxygen").value);
    const symptoms = document.getElementById("symptoms").value.toLowerCase();
    const heartRate = Number(document.getElementById("heartRate").value);
    let risk = "verde";
    if (oxygen < 90 || pressure.systolic >= 180 || temperature >= 38.5 || symptoms.includes("dor no peito") || symptoms.includes("convuls")) {
      risk = "vermelho";
    } else if (oxygen < 94 || pressure.systolic >= 160 || temperature >= 37.8 || heartRate > 120 || symptoms.includes("falta de ar")) {
      risk = "amarelo";
    } else if (symptoms.includes("receita") || symptoms.includes("atestado")) {
      risk = "branco";
    }
    return risk;
  }

  suggestRisk() {
    this.suggestedRisk = this.calculateSuggestion();
    this.dom.riskSuggestion.textContent = `Sugestão de triagem: ${this.priorityLabels[this.suggestedRisk]} (aguardando confirmação do enfermeiro).`;
  }

  confirmSuggestedRisk() {
    if (!this.suggestedRisk) {
      this.suggestRisk();
    }
    const riskInput = document.querySelector(`[name="classification"][value="${this.suggestedRisk}"]`);
    if (riskInput) {
      riskInput.checked = true;
    }
    this.dom.riskSuggestion.textContent = `Sugestão confirmada: ${this.priorityLabels[this.suggestedRisk]}`;
  }

  handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(this.dom.triageForm);
    const selectedClassification = this.dom.triageForm.querySelector('input[name="classification"]:checked');
    const classification = this.normalizeClassification(selectedClassification?.value ?? null);
    const symptoms = data.get("symptoms")?.toString().trim() ?? "";
    if (!this.state.selectedPatientId || !data.get("bloodPressure") || !data.get("temperature") || !data.get("oxygen") || !symptoms || !classification) {
      this.callbacks.showMessage(this.dom.triageMessage, "Preencha todos os dados da triagem e selecione ou confirme o nível de risco.");
      return;
    }
    if (/\d/.test(symptoms)) {
      this.callbacks.showMessage(this.dom.triageMessage, "As observações não podem conter números.");
      return;
    }
    this.state.triages.push({
      id: crypto.randomUUID(),
      patientId: this.state.selectedPatientId,
      bloodPressure: data.get("bloodPressure"),
      temperature: data.get("temperature"),
      oxygen: data.get("oxygen"),
      heartRate: data.get("heartRate"),
      symptoms,
      classification,
      time: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    });
    this.state.triageInProgressIds = this.state.triageInProgressIds.filter((id) => id !== this.state.selectedPatientId);
    if (!this.state.triageCompletedIds.includes(this.state.selectedPatientId)) {
      this.state.triageCompletedIds.push(this.state.selectedPatientId);
    }
    this.state.save();
    this.reset();
    this.callbacks.showMessage(this.dom.triageMessage, "Triagem registrada.");
    this.callbacks.renderAll();
  }

  reset() {
    this.dom.triageForm.reset();
    this.state.selectedPatientId = "";
    this.suggestedRisk = null;
    this.dom.riskSuggestion.textContent = "Sem sugestão";
    this.renderPatientOptions();
    this.renderPatientSummary();
    this.renderVitalPreview();
  }

  renderPatientOptions() {
    if (this.state.patients.length === 0) {
      this.dom.triagePatient.innerHTML = `<option value="">Nenhum paciente cadastrado</option>`;
      return;
    }
    this.dom.triagePatient.innerHTML = `<option value="">Selecionar paciente</option>` + this.state.patients.map((patient) => `
      <option value="${patient.id}">${patient.firstName}</option>
    `).join("");
    this.dom.triagePatient.value = this.state.selectedPatientId;
  }

  renderPatientSummary() {
    const patient = this.state.getSelectedPatient();
    if (!patient) {
      this.dom.patientSummary.innerHTML = `<div class="empty-state">Selecione um paciente para ver o resumo.</div>`;
      return;
    }
    this.dom.patientSummary.innerHTML = `
      <div class="summary-row"><span>Nome</span><strong>${this.state.getPatientName(patient)}</strong></div>
      <div class="summary-row"><span>Idade</span><strong>${patient.age}</strong></div>
      <div class="summary-row"><span>Gênero</span><strong>${patient.gender}</strong></div>
      <div class="summary-row"><span>Convênio</span><strong>${patient.insuranceName}</strong></div>
      <div class="summary-row"><span>Plano</span><strong>${patient.insurancePlan}</strong></div>
    `;
  }

  renderVitalPreview() {
    const pressure = document.getElementById("bloodPressure").value || "--";
    const temperature = document.getElementById("temperature").value || "--";
    const oxygen = document.getElementById("oxygen").value || "--";
    const oxygenNumber = Number(oxygen);
    const oxygenClass = oxygenNumber < 90 ? "alert" : "";
    this.dom.vitalPreview.innerHTML = `
      <div class="vital-row"><span>Pressão</span><strong>${pressure}</strong></div>
      <div class="vital-row"><span>Temperatura</span><strong>${temperature} °C</strong></div>
      <div class="vital-row"><span>Oxigenação</span><strong class="${oxygenClass}">${oxygen}%</strong></div>
    `;
  }
}

window.TriageController = TriageController;
