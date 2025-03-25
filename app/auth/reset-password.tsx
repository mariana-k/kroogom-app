import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const RATE_LIMIT_SECONDS = 7;

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResetPassword = async () => {
    try {
      // Basic validation
      if (!email) {
        throw new Error('Please enter your email address');
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (countdown > 0) {
        throw new Error(`Please wait ${countdown} seconds before trying again`);
      }

      setLoading(true);
      setError(null);
      setSuccess(false);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/update-password`,
        }
      );

      if (resetError) {
        if (resetError.message.includes('rate_limit')) {
          setCountdown(RATE_LIMIT_SECONDS);
          throw new Error(`Please wait ${RATE_LIMIT_SECONDS} seconds before trying again`);
        }
        throw resetError;
      }

      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source="https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=800&auto=format&fit=crop&q=80"
            style={styles.heroImage}
            contentFit="cover"
          />
          <View style={styles.overlay} />
          <View style={styles.headerContent}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive password reset instructions
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successText}>
                We've sent password reset instructions to {email}. Please check
                your inbox and follow the link to reset your password.
              </Text>
              <Link href="/auth/sign-in" asChild>
                <Pressable style={styles.backButton}>
                  <ArrowLeft size={20} color="#6366f1" />
                  <Text style={styles.backButtonText}>Back to Sign In</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#94a3b8"
                  editable={!loading}
                  onSubmitEditing={handleResetPassword}
                />
              </View>

              <Pressable
                style={[
                  styles.button,
                  (loading || countdown > 0) && styles.buttonDisabled
                ]}
                onPress={handleResetPassword}
                disabled={loading || countdown > 0}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : countdown > 0 ? (
                  <Text style={styles.buttonText}>
                    Try again in {countdown}s
                  </Text>
                ) : (
                  <Text style={styles.buttonText}>Send Reset Instructions</Text>
                )}
              </Pressable>

              <Link href="/auth/sign-in" asChild>
                <Pressable style={styles.backButton}>
                  <ArrowLeft size={20} color="#6366f1" />
                  <Text style={styles.backButtonText}>Back to Sign In</Text>
                </Pressable>
              </Link>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.9,
  },
  form: {
    padding: 24,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 8,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 48,
    marginLeft: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#6366f1',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
  },
});