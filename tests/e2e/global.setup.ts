import { resetLocalState } from "../unit/helpers/reset-local-state";

export default function globalSetup() {
  resetLocalState({ stdio: "inherit" });
}
