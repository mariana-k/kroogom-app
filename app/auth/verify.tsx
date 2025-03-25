import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, useLocalSearchParams, router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [error, setError] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendDisabled && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(60);
    }
    return () => clearInterval(timer);
  }, [resendDisabled, countdown]);

  const handleResendEmail = async () => {
    try {
      setError(null);
      setResendDisabled(true);

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email as string,
      });

      if (resendError) throw resendError;
    } catch (e) {
      setError(e.message);
      setResendDisabled(false);
    }
  };

  const handleSignIn = () => {
    router.replace('/auth/sign-in');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Mail size={48} color="#6366f1" style={styles.icon} />
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.description}>
          We've sent a verification email to{' '}
          <Text style={styles.emailText}>{email}</Text>. Please check your inbox
          and click the verification link to complete your registration.
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={[styles.button, resendDisabled && styles.buttonDisabled]}
          onPress={handleResendEmail}
          disabled={resendDisabled}>
          <Text style={styles.buttonText}>
            {resendDisabled
              ? `Resend email (${countdown}s)`
              : 'Resend verification email'}
          </Text>
        </Pressable>

        <Pressable style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>
            Already verified? Sign in
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emailText: {
    color: '#0f172a',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    paddingVertical: 12,
  },
  signInButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
  },
});