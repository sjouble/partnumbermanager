import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { styles } from './styles';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { createWorker } from 'tesseract.js';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PartNumber {
  id: string;
  number: string;
  quantity: number;
  unit: string;
  expiryDate: string;
}

interface Unit {
  id: string;
  name: string;
}

export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [partNumbers, setPartNumbers] = useState<PartNumber[]>([]);
  const [units, setUnits] = useState<Unit[]>([
    { id: '1', name: '개' },
    { id: '2', name: 'EA' },
    { id: '3', name: 'PCS' },
    { id: '4', name: 'BOX' },
    { id: '5', name: 'SET' },
  ]);
  const [showUnitEditor, setShowUnitEditor] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [newUnitName, setNewUnitName] = useState('');
  const [editingUnitName, setEditingUnitName] = useState('');
  const [editingPartNumber, setEditingPartNumber] = useState<PartNumber | null>(null);
  const [editingQuantity, setEditingQuantity] = useState('');
  const [editingExpiryDate, setEditingExpiryDate] = useState('');

  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        Alert.alert('오류', '사진 촬영 중 오류가 발생했습니다.');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const processImage = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      const worker = await createWorker('kor+eng');
      const { data: { text } } = await worker.recognize(capturedImage);
      await worker.terminate();
      
      setRecognizedText(text);
      setSelectedText(text);
    } catch (error) {
      Alert.alert('OCR 오류', '이미지 인식 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setRecognizedText('');
    setSelectedText('');
  };

  const addPartNumber = () => {
    if (!selectedText.trim()) {
      Alert.alert('알림', '파트넘버를 입력해주세요.');
      return;
    }

    const newPartNumber: PartNumber = {
      id: Date.now().toString(),
      number: selectedText.trim(),
      quantity: 1,
      unit: units[0]?.name || '개',
      expiryDate: '',
    };

    setPartNumbers([...partNumbers, newPartNumber]);
    setSelectedText('');
  };

  const removePartNumber = (id: string) => {
    setPartNumbers(partNumbers.filter(pn => pn.id !== id));
  };

  const updatePartNumber = (id: string, field: keyof PartNumber, value: any) => {
    setPartNumbers(partNumbers.map(pn => 
      pn.id === id ? { ...pn, [field]: value } : pn
    ));
  };

  const addUnit = () => {
    if (!newUnitName.trim()) {
      Alert.alert('알림', '단위명을 입력해주세요.');
      return;
    }

    const newUnit: Unit = {
      id: Date.now().toString(),
      name: newUnitName.trim(),
    };

    setUnits([...units, newUnit]);
    setNewUnitName('');
  };

  const editUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setEditingUnitName(unit.name);
    setShowUnitEditor(true);
  };

  const saveUnit = () => {
    if (!editingUnit || !editingUnitName.trim()) return;

    setUnits(units.map(u => 
      u.id === editingUnit.id ? { ...u, name: editingUnitName.trim() } : u
    ));
    setShowUnitEditor(false);
    setEditingUnit(null);
    setEditingUnitName('');
  };

  const deleteUnit = (id: string) => {
    if (units.length <= 1) {
      Alert.alert('알림', '최소 하나의 단위는 유지해야 합니다.');
      return;
    }
    setUnits(units.filter(u => u.id !== id));
  };

  const exportData = async () => {
    if (partNumbers.length === 0) {
      Alert.alert('알림', '내보낼 파트넘버가 없습니다.');
      return;
    }

    const data = partNumbers.map(pn => 
      `${pn.number} - ${pn.quantity}${pn.unit}${pn.expiryDate ? ` (${pn.expiryDate})` : ''}`
    ).join('\n');

    const fileName = `partnumbers_${new Date().toISOString().split('T')[0]}.txt`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    try {
      await FileSystem.writeAsStringAsync(fileUri, data);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('오류', '파일 내보내기 중 오류가 발생했습니다.');
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>카메라 권한을 확인하는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>카메라 접근 권한이 필요합니다.</Text>
          <TouchableOpacity style={styles.button} onPress={() => Camera.requestCameraPermissionsAsync()}>
            <Text style={styles.buttonText}>권한 요청</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>파트넘버 매니저</Text>
        <Text style={styles.headerSubtitle}>카메라로 파트넘버를 스캔하고 관리하세요</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 카메라 섹션 */}
        <View style={styles.cameraSection}>
          <Text style={styles.sectionTitle}>카메라</Text>
          
          {!capturedImage ? (
            <View style={styles.cameraContainer}>
              <Camera
                ref={cameraRef}
                style={styles.camera}
                type={cameraType}
                ratio="4:3"
              />
              <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
                  <Text style={styles.cameraButtonText}>촬영</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                  <Text style={styles.cameraButtonText}>갤러리</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.imageContainer}>
              <Text style={styles.imageText}>이미지가 캡처되었습니다</Text>
              <View style={styles.imageControls}>
                <TouchableOpacity style={styles.button} onPress={processImage} disabled={isProcessing}>
                  <Text style={styles.buttonText}>
                    {isProcessing ? '처리 중...' : 'OCR 처리'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={retakePicture}>
                  <Text style={styles.buttonText}>다시 촬영</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* OCR 결과 섹션 */}
        {recognizedText && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>인식된 텍스트</Text>
            <TextInput
              style={styles.textInput}
              value={selectedText}
              onChangeText={setSelectedText}
              multiline
              placeholder="인식된 텍스트를 확인하고 수정하세요"
            />
            <TouchableOpacity style={styles.button} onPress={addPartNumber}>
              <Text style={styles.buttonText}>파트넘버 추가</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 파트넘버 목록 */}
        {partNumbers.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>파트넘버 목록</Text>
            {partNumbers.map((partNumber) => (
              <View key={partNumber.id} style={styles.partNumberItem}>
                <Text style={styles.partNumberText}>{partNumber.number}</Text>
                <View style={styles.partNumberDetails}>
                  <TextInput
                    style={styles.quantityInput}
                    value={partNumber.quantity.toString()}
                    onChangeText={(text) => updatePartNumber(partNumber.id, 'quantity', parseInt(text) || 1)}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unitText}>{partNumber.unit}</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={partNumber.expiryDate}
                    onChangeText={(text) => updatePartNumber(partNumber.id, 'expiryDate', text)}
                    placeholder="유통기한"
                  />
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePartNumber(partNumber.id)}
                >
                  <Text style={styles.removeButtonText}>삭제</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 단위 관리 */}
        <View style={styles.unitSection}>
          <Text style={styles.sectionTitle}>단위 관리</Text>
          <View style={styles.addUnitContainer}>
            <TextInput
              style={styles.unitInput}
              value={newUnitName}
              onChangeText={setNewUnitName}
              placeholder="새 단위명"
            />
            <TouchableOpacity style={styles.button} onPress={addUnit}>
              <Text style={styles.buttonText}>추가</Text>
            </TouchableOpacity>
          </View>
          {units.map((unit) => (
            <View key={unit.id} style={styles.unitItem}>
              <Text style={styles.unitText}>{unit.name}</Text>
              <View style={styles.unitActions}>
                <TouchableOpacity style={styles.editButton} onPress={() => editUnit(unit)}>
                  <Text style={styles.editButtonText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteUnit(unit.id)}
                  disabled={units.length <= 1}
                >
                  <Text style={styles.deleteButtonText}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* 내보내기 */}
        {partNumbers.length > 0 && (
          <View style={styles.exportSection}>
            <TouchableOpacity style={styles.exportButton} onPress={exportData}>
              <Text style={styles.exportButtonText}>데이터 내보내기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 단위 편집 모달 */}
      {showUnitEditor && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>단위 수정</Text>
            <TextInput
              style={styles.modalInput}
              value={editingUnitName}
              onChangeText={setEditingUnitName}
              placeholder="단위명"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.button} onPress={saveUnit}>
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowUnitEditor(false)}>
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
} 