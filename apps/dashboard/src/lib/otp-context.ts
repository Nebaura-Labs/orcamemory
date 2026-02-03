export type OtpFlow = "sign-in" | "sign-up";
export type OtpMethod = "email";

export type OtpContext = {
	flow: OtpFlow;
	method: OtpMethod;
	email?: string;
	preferredMethod?: OtpMethod;
	name?: string;
	password?: string;
};

const STORAGE_KEY = "orca:otp-context";

export const saveOtpContext = (context: OtpContext) => {
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
	} catch {
		// ignore storage errors
	}
};

export const loadOtpContext = (): OtpContext | null => {
	try {
		const value = sessionStorage.getItem(STORAGE_KEY);
		if (!value) {
			return null;
		}
		return JSON.parse(value) as OtpContext;
	} catch {
		return null;
	}
};

export const clearOtpContext = () => {
	try {
		sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore storage errors
	}
};
