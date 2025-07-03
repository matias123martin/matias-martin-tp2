//#region mostrar toast
export function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
//#endregion
//#region METODOS TOAST

export function showSuccessToast(message) {
  showToast(message, "success");
}

export function showErrorToast(message) {
  showToast(message, "error");
}

export function showWarningToast(message) {
  showToast(message, "warning");
}
//#endregion
