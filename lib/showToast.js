import { Bounce, toast } from "react-toastify";

export const showToast = (type = "default", message = "") => {
  const options = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    transition: Bounce,
  };

  switch (type) {
    case "success":
      return toast.success(message, options);
    case "error":
      return toast.error(message, options);
    case "info":
      return toast.info(message, options);
    case "warning":
      return toast.warning(message, options);
    default:
      return toast(message, options);
  }
};