import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@myorg/shared';

const AUTH_STORAGE_KEY = 'authenticated';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loginWithGoogle } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAccessGranted, setIsAccessGranted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (localStorage.getItem(AUTH_STORAGE_KEY) === 'true') {
      setIsAccessGranted(true);
    }
  }, []);

  useEffect(() => {
    if (user && isAccessGranted) {
      navigate('/', { replace: true });
    }
  }, [user, isAccessGranted, navigate]);

  const handleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      if (typeof window !== 'undefined' && localStorage.getItem(AUTH_STORAGE_KEY) === 'true') {
        setIsAccessGranted(true);
        return;
      }

      setPassword('');
      setShowPopup(true);
    } catch {
      // loginWithGoogle failures are handled inside useAuth
    }
  };

  const handleConfirm = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (password === import.meta.env.VITE_APP_ACCESS_PASSWORD) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      }
      setIsAccessGranted(true);
      setShowPopup(false);
      setPassword('');
      setError('');
      navigate('/', { replace: true });
    } else {
      setError('\u30d1\u30b9\u30ef\u30fc\u30c9\u304c\u9055\u3044\u307e\u3059');
    }
  };

  const handleCancel = () => {
    setShowPopup(false);
    setPassword('');
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-3xl font-bold text-slate-900">Scope</h1>
        <p className="mb-6 text-slate-500">1on1 Companion</p>
        <button
          type="button"
          onClick={handleLogin}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={showPopup}
        >
          <img
            className="h-6 w-6"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            loading="lazy"
            alt="google logo"
          />
          <span>{'Google\u3067\u30ed\u30b0\u30a4\u30f3'}</span>
        </button>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-xs rounded-xl bg-white p-6 text-left shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {'\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044'}
            </h2>
            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) {
                      setError('');
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder={'\u30d1\u30b9\u30ef\u30fc\u30c9'}
                  autoFocus
                />
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                >
                  {'\u30ad\u30e3\u30f3\u30bb\u30eb'}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  OK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
