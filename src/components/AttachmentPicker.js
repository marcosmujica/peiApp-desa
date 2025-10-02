import React, { useState, useEffect } from 'react'
import { Modal, View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native'
import { MaterialIcons, Feather, Entypo } from '@expo/vector-icons'

let _showResolver = null
let _setVisible = null

export function showAttachmentPicker() {
  return new Promise((resolve) => {
    _showResolver = resolve
    if (_setVisible) _setVisible(true)
  })
}

export function hideAttachmentPicker(result) {
  if (_showResolver) {
    _showResolver(result)
    _showResolver = null
  }
  if (_setVisible) _setVisible(false)
}

export default function AttachmentPickerHost({camera = false, gallery = false, file = false}) {
  
  const [isCamera, setCamera] = useState(camera)
  const [isFile, setFile] = useState(file)
  const [isGallery, setGallery] = useState(gallery)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isCamera && !isGallery && !isFile ) {hideAttachmentPicker({ type: 'camera' }) 
      return}

    if (!isCamera && isGallery && !isFile ) {hideAttachmentPicker({ type: 'gallery' }) 
      return}

    if (!isCamera && !isGallery && isFile ) {hideAttachmentPicker({ type: 'file' }) 
      return}
    _setVisible = setVisible

    return () => { _setVisible = null; _showResolver = null }
  }, [])

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {isCamera && <TouchableOpacity style={styles.iconBtn} onPress={() => hideAttachmentPicker({ type: 'camera' })}>
            <Entypo name="camera" size={28} />
            <Text style={styles.label}>Cámara</Text>
          </TouchableOpacity>
          }
          {isGallery && <TouchableOpacity style={styles.iconBtn} onPress={() => hideAttachmentPicker({ type: 'gallery' })}>
            <MaterialIcons name="photo-library" size={28} />
            <Text style={styles.label}>Galería</Text>
          </TouchableOpacity>
          }   

          
          {isFile && <TouchableOpacity style={styles.iconBtn} onPress={() => hideAttachmentPicker({ type: 'file' })}>
            <Feather name="file-text" size={28} />
            <Text style={styles.label}>Archivo</Text>
          </TouchableOpacity>
          }
        </View>
        <TouchableOpacity style={styles.backdrop} onPress={() => hideAttachmentPicker(null)} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  card: { width: 300, backgroundColor: '#fff', borderRadius: 12, padding: 18, flexDirection: 'row', justifyContent: 'space-around', zIndex: 30, elevation: 10 },
  iconBtn: { alignItems: 'center' },
  label: { marginTop: 6, fontSize: 12 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }
})
