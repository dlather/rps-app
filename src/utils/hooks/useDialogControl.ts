const useDialogControl = (dialogId: string) => {
  const showModal = () => {
    const dialog = document.getElementById(dialogId) as HTMLDialogElement;
    dialog?.showModal();
  };

  const closeModal = () => {
    const dialog = document.getElementById(dialogId) as HTMLDialogElement;
    dialog?.close();
  };

  return { showModal, closeModal };
};

export default useDialogControl;
