class PatientRegistration {
  constructor(state, dom, callbacks) {
    this.state = state;
    this.dom = dom;
    this.callbacks = callbacks;
  }

  init() {
    this.dom.patientForm.addEventListener("submit", (event) => this.handleSubmit(event));
    this.dom.clearPatientForm.addEventListener("click", () => this.reset());
    this.dom.patientSearch.addEventListener("input", () => this.render());
    this.dom.patientList.addEventListener("click", (event) => this.handleListClick(event));
    this.setupValidation();
  }

  setupValidation() {
    const fields = this.dom.patientForm.querySelectorAll("input, select");
    fields.forEach((field) => {
      field.addEventListener("keydown", (event) => {
        if (this.shouldBlockNumbers(field.name) && /\d/.test(event.key)) {
          event.preventDefault();
        }
      });
      field.addEventListener("input", () => {
        if (this.shouldBlockNumbers(field.name)) {
          this.sanitizeTextField(field);
        }
        this.validateField(field.name);
      });
      field.addEventListener("change", () => this.validateField(field.name));
      field.addEventListener("blur", () => this.validateField(field.name));
    });
  }

  shouldBlockNumbers(fieldName) {
    return ["firstName", "lastName", "address", "insuranceName"].includes(fieldName);
  }

  sanitizeTextField(field) {
    const sanitizedValue = field.value.replace(/\d/g, "");
    if (field.value !== sanitizedValue) {
      field.value = sanitizedValue;
    }
  }

  createErrorElement(field) {
    const container = field.closest("label");
    if (!container) {
      return null;
    }
    let errorNode = container.querySelector(".field-error");
    if (!errorNode) {
      errorNode = document.createElement("div");
      errorNode.className = "field-error";
      container.appendChild(errorNode);
    }
    return errorNode;
  }

  setFieldError(field, message) {
    const errorNode = this.createErrorElement(field);
    if (!errorNode) {
      return;
    }
    if (message) {
      field.classList.add("invalid");
      errorNode.textContent = message;
      errorNode.hidden = false;
    } else {
      field.classList.remove("invalid");
      errorNode.textContent = "";
      errorNode.hidden = true;
    }
  }

  validateField(fieldName) {
    const field = this.dom.patientForm.elements[fieldName];
    if (!field) {
      return true;
    }
    const value = field.value.trim();
    let errorMessage = "";

    switch (fieldName) {
      case "firstName":
        if (!value) {
          errorMessage = "Informe o nome do paciente.";
        } else if (value.length < 2) {
          errorMessage = "O nome deve ter pelo menos 2 letras.";
        } else if (/\d/.test(value)) {
          errorMessage = "O nome não pode conter números.";
        }
        break;
      case "lastName":
        if (!value) {
          errorMessage = "Informe o sobrenome do paciente.";
        } else if (value.length < 2) {
          errorMessage = "O sobrenome deve ter pelo menos 2 letras.";
        } else if (/\d/.test(value)) {
          errorMessage = "O sobrenome não pode conter números.";
        }
        break;
      case "age":
        if (!value) {
          errorMessage = "Informe a idade do paciente.";
        } else if (!/^\d+$/.test(value) || Number(value) < 0 || Number(value) > 130) {
          errorMessage = "A idade deve ser um número entre 0 e 130.";
        }
        break;
      case "gender":
        if (!value) {
          errorMessage = "Selecione o gênero do paciente.";
        }
        break;
      case "address":
        if (!value) {
          errorMessage = "Informe o endereço do paciente.";
        } else if (value.length < 5) {
          errorMessage = "O endereço deve ter pelo menos 5 caracteres.";
        } else if (/\d/.test(value)) {
          errorMessage = "O endereço não pode conter números.";
        }
        break;
      case "insuranceName":
        if (!value) {
          errorMessage = "Informe o nome do convênio.";
        } else if (value.length < 2) {
          errorMessage = "O nome do convênio é inválido.";
        } else if (/\d/.test(value)) {
          errorMessage = "O nome do convênio não pode conter números.";
        }
        break;
      case "insuranceCard":
        if (!value) {
          errorMessage = "Informe o número da carteirinha.";
        } else if (!/^[A-Za-z0-9-]{2,20}$/.test(value)) {
          errorMessage = "A carteirinha deve conter apenas letras, números ou hífen.";
        }
        break;
      case "insuranceValidUntil":
        if (value) {
          const selectedDate = new Date(`${value}T23:59:59`);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) {
            errorMessage = "A data de validade deve ser futura.";
          }
        }
        break;
      case "insurancePlan":
        if (!value) {
          errorMessage = "Selecione um plano.";
        }
        break;
      default:
        break;
    }

    this.setFieldError(field, errorMessage);
    return !errorMessage;
  }

  validateForm() {
    const fields = ["firstName", "lastName", "age", "gender", "address", "insuranceName", "insuranceCard", "insuranceValidUntil", "insurancePlan"];
    return fields.every((fieldName) => this.validateField(fieldName));
  }

  handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(this.dom.patientForm);
    const rawAge = data.get("age");
    const age = String(rawAge ?? "").trim();
    const ageNumber = Number(age);
    const patient = {
      id: crypto.randomUUID(),
      firstName: data.get("firstName").trim(),
      lastName: data.get("lastName").trim(),
      age,
      gender: data.get("gender"),
      address: data.get("address").trim(),
      insuranceName: data.get("insuranceName").trim(),
      insuranceCard: data.get("insuranceCard").trim(),
      insuranceValidUntil: data.get("insuranceValidUntil"),
      insurancePlan: data.get("insurancePlan"),
      createdAt: new Date().toISOString()
    };
    if (!this.validateForm()) {
      this.callbacks.showMessage(this.dom.patientMessage, "Corrija os campos destacados.");
      return;
    }
    this.state.patients.push(patient);
    this.state.selectedPatientId = patient.id;
    this.state.save();
    this.reset();
    this.callbacks.showMessage(this.dom.patientMessage, "Paciente cadastrado.");
    this.callbacks.renderAll();
  }

  handleListClick(event) {
    const selectButton = event.target.closest("[data-select-patient]");
    const deleteButton = event.target.closest("[data-delete-patient]");
    if (selectButton) {
      const patientId = selectButton.dataset.selectPatient;
      this.state.selectedPatientId = patientId;
      if (!this.state.triageInProgressIds.includes(patientId)) {
        this.state.triageInProgressIds.push(patientId);
      }
      this.state.triageCompletedIds = this.state.triageCompletedIds.filter((id) => id !== patientId);
      this.state.save();
      this.callbacks.setScreen("triagem");
      this.callbacks.renderAll();
    }
    if (deleteButton) {
      const index = Number(deleteButton.dataset.deletePatient);
      const removed = this.state.patients.splice(index, 1)[0];
      if (removed) {
        this.state.triages = this.state.triages.filter((triage) => triage.patientId !== removed.id);
        this.state.triageInProgressIds = this.state.triageInProgressIds.filter((id) => id !== removed.id);
        this.state.triageCompletedIds = this.state.triageCompletedIds.filter((id) => id !== removed.id);
      }
      this.state.save();
      this.callbacks.renderAll();
    }
  }

  reset() {
    this.dom.patientForm.reset();
    this.dom.patientForm.querySelectorAll("input, select").forEach((field) => {
      this.setFieldError(field, "");
    });
  }

  render() {
    const search = this.dom.patientSearch.value.toLowerCase();
    const receptionPatients = this.state.patients.filter((patient) => {
      const matches = patient.firstName.toLowerCase().includes(search);
      return matches && !this.state.triageInProgressIds.includes(patient.id) && !this.state.triageCompletedIds.includes(patient.id);
    });
    const inProgressPatients = this.state.patients.filter((patient) => {
      const matches = patient.firstName.toLowerCase().includes(search);
      return matches && this.state.triageInProgressIds.includes(patient.id);
    });
    const completedPatients = this.state.patients.filter((patient) => {
      const matches = patient.firstName.toLowerCase().includes(search);
      return matches && this.state.triageCompletedIds.includes(patient.id);
    });

    const renderPatientCards = (patients, showActions = true) => patients.map((patient, index) => `
      <article class="patient-card">
        <header>
          <div>
            <strong>${this.state.getPatientName(patient)}</strong>
            <small>${patient.age} anos · ${patient.gender}</small>
          </div>
          <span class="tag">${patient.insurancePlan}</span>
        </header>
        <div class="meta-line">${patient.address}</div>
        <div class="meta-line">${patient.insuranceName} · ${patient.insuranceCard}</div>
        ${showActions ? `
          <div class="patient-actions">
            <button class="small-button" data-select-patient="${patient.id}" type="button">Triar</button>
            <button class="small-button danger-button" data-delete-patient="${index}" type="button">Remover</button>
          </div>` : ""}
      </article>
    `).join("");

    const groups = [];
    if (receptionPatients.length > 0) {
      groups.push(`<div><h3>Recepção</h3>${renderPatientCards(receptionPatients)}</div>`);
    }
    if (inProgressPatients.length > 0) {
      groups.push(`<div><h3>Triagem em andamento</h3>${renderPatientCards(inProgressPatients, false)}</div>`);
    }
    if (completedPatients.length > 0) {
      groups.push(`<div><h3>Triagem concluída</h3>${renderPatientCards(completedPatients, false)}</div>`);
    }

    if (groups.length === 0) {
      this.dom.patientList.innerHTML = `<div class="empty-state">Nenhum paciente na recepção.</div>`;
      return;
    }

    this.dom.patientList.innerHTML = groups.join("");
  }
}

window.PatientRegistration = PatientRegistration;
