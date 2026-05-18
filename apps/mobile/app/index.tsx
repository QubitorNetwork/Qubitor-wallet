import { Redirect } from "expo-router";

export default function Index() {
  // First-run: route to onboarding. Later, gate this on whether an account exists.
  return <Redirect href="/onboarding/welcome" />;
}
