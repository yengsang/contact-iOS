import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { updateUserProfile, uploadUserProfileImage } from '../api/appUser';
import { getDeviceId, getDeviceInfoPayload } from '../device/deviceInfo';
import { LaunchContext } from '../types';
import { RegisteredUserSession } from './PhoneVerificationScreen';

type UserProfileScreenProps = {
  launchContext: LaunchContext;
  session: RegisteredUserSession;
  onBack: () => void;
  onCompleted: () => void;
};

type FormState = {
  profileUserId: string;
  fullName: string;
  email: string;
  paynowIdType: string;
  paynowIdValue: string;
  paynowName: string;
  gender: string;
  birthday: string;
  occupation: string;
};

const paynowIdTypes = ['Mobile Number', 'NRIC / FIN'];
const genders = ['Male', 'Female'];

const initialFormState: FormState = {
  profileUserId: '',
  fullName: '',
  email: '',
  paynowIdType: 'Mobile Number',
  paynowIdValue: '',
  paynowName: '',
  gender: '',
  birthday: '',
  occupation: '',
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  if (!value) {
    return new Date(2000, 0, 1);
  }

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return new Date(2000, 0, 1);
  }

  return new Date(year, month - 1, day);
}

function OptionChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View style={styles.chipsRow}>
      {options.map((option) => {
        const active = value === option;
        return (
          <Pressable
            key={option}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function UserProfileScreen({ launchContext, session, onBack, onCompleted }: UserProfileScreenProps) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<null | { uri: string; fileName: string; mimeType: string }>(null);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  const canSubmit = useMemo(() => !busy && !!form.profileUserId.trim() && !!form.fullName.trim() && !!form.email.trim() && !!form.paynowIdType.trim() && !!form.paynowIdValue.trim() && !!form.paynowName.trim() && !!form.gender.trim() && !!form.birthday.trim() && !!form.occupation.trim() && !!selectedImage, [busy, form, selectedImage]);

  const setField = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const pickScreenshot = async () => {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Please allow photo access so the user can choose the balance screenshot.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
    if (result.canceled || !result.assets.length) {
      return;
    }

    const asset = result.assets[0];
    setSelectedImage({ uri: asset.uri, fileName: asset.fileName ?? `balance-screenshot-${Date.now()}.jpg`, mimeType: asset.mimeType ?? 'image/jpeg' });
  };

  const onBirthdayChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowBirthdayPicker(false);
    }

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    setField('birthday', formatDate(selectedDate));
  };

  const handleSubmit = async () => {
    if (!canSubmit || !selectedImage) {
      setError('Please complete the form and choose the screenshot first.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const deviceId = await getDeviceId();
      const deviceInfo = getDeviceInfoPayload();

      setStatus('Updating user profile...');
      await updateUserProfile({
        qrToken: launchContext.qrToken,
        referralCode: launchContext.referralCode,
        userId: session.userId,
        profileUserId: form.profileUserId.trim(),
        userEmail: form.email.trim(),
        userFullName: form.fullName.trim(),
        userPhone: session.phone,
        paynowIdType: form.paynowIdType.trim(),
        paynowIdValue: form.paynowIdValue.trim(),
        paynowName: form.paynowName.trim(),
        gender: form.gender.trim(),
        birthday: form.birthday.trim(),
        occupation: form.occupation.trim(),
        deviceId,
        deviceInfo,
      });

      setStatus('Uploading balance screenshot...');
      await uploadUserProfileImage({
        qrToken: launchContext.qrToken,
        referralCode: launchContext.referralCode,
        userId: session.userId,
        imageUri: selectedImage.uri,
        fileName: selectedImage.fileName,
        mimeType: selectedImage.mimeType,
      });

      setStatus('Profile and screenshot uploaded successfully.');
      onCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile and upload screenshot.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Reward Claim</Text>
        <Text style={styles.title}>Your Details</Text>
        <Text style={styles.subtitle}>Fill in your details and upload your balance screenshot before continuing to the contacts step.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Registered Session</Text>
          <Text style={styles.metaValue}>User ID: {session.userId}</Text>
          <Text style={styles.metaValue}>Phone: {session.phone}</Text>
          <Text style={styles.metaValue}>Referral Code: {session.referralCode || '-'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Profile User ID</Text>
          <TextInput style={styles.input} value={form.profileUserId} onChangeText={(value) => setField('profileUserId', value)} placeholder="User ID shown inside the app" />
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={form.fullName} onChangeText={(value) => setField('fullName', value)} placeholder="Full name" />
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={form.email} onChangeText={(value) => setField('email', value)} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />

          <Text style={styles.label}>PayNow ID Type</Text>
          <OptionChips options={paynowIdTypes} value={form.paynowIdType} onChange={(value) => setField('paynowIdType', value)} />

          <Text style={styles.label}>PayNow ID Value</Text>
          <TextInput style={styles.input} value={form.paynowIdValue} onChangeText={(value) => setField('paynowIdValue', value)} placeholder={form.paynowIdType === 'NRIC / FIN' ? 'NRIC / FIN' : 'Mobile Number'} />

          <Text style={styles.label}>Name On PayNow</Text>
          <TextInput style={styles.input} value={form.paynowName} onChangeText={(value) => setField('paynowName', value)} placeholder="Name on PayNow" />

          <Text style={styles.label}>Gender</Text>
          <OptionChips options={genders} value={form.gender} onChange={(value) => setField('gender', value)} />

          <Text style={styles.label}>Birthday</Text>
          <Pressable style={styles.inputButton} onPress={() => setShowBirthdayPicker(true)}>
            <Text style={form.birthday ? styles.inputButtonText : styles.inputButtonPlaceholder}>{form.birthday || 'Choose birthday'}</Text>
          </Pressable>
          {showBirthdayPicker ? (
            <DateTimePicker
              value={parseDate(form.birthday)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={onBirthdayChange}
            />
          ) : null}
          {Platform.OS === 'ios' && showBirthdayPicker ? (
            <Pressable style={styles.secondaryButton} onPress={() => setShowBirthdayPicker(false)}>
              <Text style={styles.secondaryButtonText}>Done Choosing Date</Text>
            </Pressable>
          ) : null}

          <Text style={styles.label}>Occupation</Text>
          <TextInput style={styles.input} value={form.occupation} onChangeText={(value) => setField('occupation', value)} placeholder="Occupation" />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Balance Screenshot</Text>
          <Pressable style={styles.secondaryButton} onPress={pickScreenshot}><Text style={styles.secondaryButtonText}>{selectedImage ? 'Change Screenshot' : 'Choose Screenshot'}</Text></Pressable>
          {selectedImage ? <Text style={styles.metaValue}>{selectedImage.fileName}</Text> : null}
          {selectedImage ? <Image source={{ uri: selectedImage.uri }} style={styles.preview} resizeMode="cover" /> : null}
        </View>

        {status ? <View style={styles.infoCard}><Text style={styles.infoText}>{status}</Text></View> : null}
        {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}
        {busy ? <View style={styles.statusRow}><ActivityIndicator color="#3b5cff" /><Text style={styles.statusText}>Working...</Text></View> : null}

        <View style={styles.actionRow}>
          <Pressable style={styles.secondaryButton} onPress={onBack}><Text style={styles.secondaryButtonText}>Back</Text></Pressable>
          <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} disabled={!canSubmit} onPress={handleSubmit}><Text style={styles.buttonText}>Save and Upload Screenshot</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7fb' },
  container: { padding: 24, gap: 16 },
  eyebrow: { fontSize: 13, fontWeight: '700', color: '#3b5cff', textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontSize: 30, fontWeight: '800', color: '#1f2a44' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#5f6c8d' },
  card: { backgroundColor: '#ffffff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e3e8f4', gap: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#6d7894', textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#d5dced', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#23314f', backgroundColor: '#fbfcff' },
  inputButton: { borderWidth: 1, borderColor: '#d5dced', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: '#fbfcff' },
  inputButtonText: { fontSize: 15, color: '#23314f' },
  inputButtonPlaceholder: { fontSize: 15, color: '#91a0bf' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#ccd6ee', backgroundColor: '#f8faff' },
  chipActive: { borderColor: '#3b5cff', backgroundColor: '#eef2ff' },
  chipText: { color: '#49617f', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#2949d3' },
  metaValue: { fontSize: 15, lineHeight: 22, color: '#23314f' },
  preview: { width: '100%', height: 220, borderRadius: 14, backgroundColor: '#edf2fa' },
  infoCard: { backgroundColor: '#eef4ff', borderRadius: 16, padding: 16 },
  infoText: { color: '#23408f', fontSize: 14, lineHeight: 21 },
  errorCard: { backgroundColor: '#fff1f3', borderRadius: 16, padding: 16 },
  errorText: { color: '#9f1239', fontSize: 14, lineHeight: 21 },
  actionRow: { gap: 12 },
  button: { backgroundColor: '#3b5cff', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aeb9dd' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { backgroundColor: '#eef2ff', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#304bba', fontSize: 15, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { fontSize: 14, color: '#4d5b7c' },
});
