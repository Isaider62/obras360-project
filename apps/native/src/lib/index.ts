export type { ApiClient } from "./api";
export { api } from "./api";
export type { Session } from "./auth";
export {
	authClient,
	getCurrentSession,
	refreshSession,
	signIn,
	signOut,
	signUp,
	useSession,
} from "./auth";
