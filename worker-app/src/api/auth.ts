import { api, clearAuthTokens, setAuthTokens } from './client';

export type AppRole = 'WORKER' | 'EMPLOYER' | 'SUPERADMIN' | 'ADMIN' | string;
export type MobileRole = 'WORKER' | 'EMPLOYER';

export interface AuthUser { id:string; email?:string|null; firstName?:string|null; lastName?:string|null; phone?:string|null; roles?:AppRole[]; }
export interface WorkerSummary { id:string; workerCode?:string; profileCompletion?:number; verificationStatus?:string; verificationScore?:number|null; }
export interface EmployerSummary { id:string; companyName?:string|null; status?:string; }
export interface AuthResponse { accessToken:string; refreshToken?:string; user:AuthUser; activeRole?:MobileRole|null; worker?:WorkerSummary; employer?:EmployerSummary; }
export interface RegisterInput { role:MobileRole; firstName:string; lastName:string; phone:string; email:string; password:string; companyName?:string; }
export interface RegistrationOtpResponse { message:string; phone:string; expiresInSeconds:number; devOtp?:string; }
export interface LoginOtpResponse { message:string; phone:string; expiresInSeconds:number; devOtp?:string; }
export interface RegistrationVerifyResponse extends AuthResponse { success:boolean; role:MobileRole; requiresApproval:boolean; message:string; }

function saveAuth(data: AuthResponse) {
  setAuthTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function login(identifier:string,password:string,role:MobileRole){const {data}=await api.post<AuthResponse>('/auth/login',{identifier,password,role});return saveAuth(data);}
export async function requestLoginOtp(phone:string,role:MobileRole){const {data}=await api.post<LoginOtpResponse>('/auth/login/request-otp',{phone,role});return data;}
export async function verifyLoginOtp(phone:string,otp:string,role:MobileRole){const {data}=await api.post<AuthResponse & {success:boolean;role:MobileRole;requiresApproval:boolean;message:string}>('/auth/login/verify-otp',{phone,otp,role});return saveAuth(data);}
export async function requestRegistrationOtp(input:RegisterInput){const {data}=await api.post<RegistrationOtpResponse>('/auth/register/request-otp',input);return data;}
export async function verifyRegistrationOtp(phone:string,otp:string){const {data}=await api.post<RegistrationVerifyResponse>('/auth/register/verify-otp',{phone,otp});return saveAuth(data);}
export async function registerWorker(input:Omit<RegisterInput,'role'|'companyName'>){const {data}=await api.post<AuthResponse>('/auth/worker/register',input);return saveAuth(data);}

export async function logoutWorker(refreshToken?: string) {
  try {
    if (refreshToken) await api.post('/auth/logout', { refreshToken });
  } finally {
    clearAuthTokens();
  }
}
