import { Redirect } from 'expo-router';

/**
 * Index Screen (Root Route)
 *
 * Redirects to the home screen.
 */

export default function Index() {
  return <Redirect href="/home" />;
}
