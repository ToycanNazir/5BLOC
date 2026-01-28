import { useMessage } from "../contexts/MessageContext";
import styles from "./MessageBanner.module.css";

export default function MessageBanner() {
  const { message } = useMessage();

  if (!message) return null;

  return (
    <div className={`${styles.message} ${styles[message.type] || styles.success}`}>
      {message.text}
    </div>
  );
}
