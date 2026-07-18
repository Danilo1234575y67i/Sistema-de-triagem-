class AppState {
  constructor(patientStorageKey, triageStorageKey, attendanceStorageKey, workflowStorageKey) {
    this.patientStorageKey = patientStorageKey;
    this.triageStorageKey = triageStorageKey;
    this.attendanceStorageKey = attendanceStorageKey;
    this.workflowStorageKey = workflowStorageKey;
    this.patients = JSON.parse(localStorage.getItem(patientStorageKey) || "[]");
    this.triages = JSON.parse(localStorage.getItem(triageStorageKey) || "[]");
    this.attendanceHistory = JSON.parse(localStorage.getItem(attendanceStorageKey) || "[]");
    const workflow = JSON.parse(localStorage.getItem(workflowStorageKey) || "{\"inProgress\":[],\"completed\":[]}" );
    this.triageInProgressIds = workflow.inProgress || [];
    this.triageCompletedIds = workflow.completed || [];
    if (this.triageCompletedIds.length === 0 && this.triages.length > 0) {
      this.triageCompletedIds = [...new Set(this.triages.map((triage) => triage.patientId))];
    }
    this.activeScreen = "cadastro";
    this.selectedPatientId = "";
  }

  save() {
    localStorage.setItem(this.patientStorageKey, JSON.stringify(this.patients));
    localStorage.setItem(this.triageStorageKey, JSON.stringify(this.triages));
    localStorage.setItem(this.attendanceStorageKey, JSON.stringify(this.attendanceHistory));
    localStorage.setItem(this.workflowStorageKey, JSON.stringify({
      inProgress: this.triageInProgressIds,
      completed: this.triageCompletedIds
    }));
  }

  getPatientName(patient) {
    return `${patient.firstName} ${patient.lastName}`;
  }

  getSelectedPatient() {
    return this.patients.find((patient) => patient.id === this.selectedPatientId);
  }
}

window.AppState = AppState;
