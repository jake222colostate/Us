import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Pill from './Pill';

type Props = {
  name: string;
  age: number;
  distanceMi: number;
  bio: string;
  avatar: string;
  photo: string;
  onCompare?: () => void;
};

export default function Card({ name, age, distanceMi, bio, avatar, photo, onCompare }: Props) {
  return (
    <View style={{ backgroundColor:'#0f172a', borderRadius:16, overflow:'hidden', marginHorizontal:'auto', marginVertical:14, width:720, maxWidth:'94%', borderWidth:1, borderColor:'#1f2937' }}>
      {/* header */}
      <View style={{ flexDirection:'row', alignItems:'center', padding:14 }}>
        <Image source={{ uri: avatar }} style={{ width:32, height:32, borderRadius:16, marginRight:10 }} />
        <View style={{ flex:1 }}>
          <Text style={{ color:'#e2e8f0', fontWeight:'600' }}>{name}, {age}</Text>
          <Text style={{ color:'#94a3b8', fontSize:12 }}>📍 {distanceMi} miles away</Text>
        </View>
      </View>

      {/* photo */}
      <Image source={{ uri: photo }} style={{ width:'100%', height:420 }} resizeMode="cover" />

      {/* body */}
      <View style={{ padding:14 }}>
        <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8 }}>
          <TouchableOpacity style={{ marginRight:8 }}>
            <Text style={{ fontSize:20 }}>🤍</Text>
          </TouchableOpacity>
          <Pill>3m</Pill>
        </View>
        <Text style={{ color:'#e2e8f0', marginBottom:12 }}>
          <Text style={{ fontWeight:'600' }}>{name} </Text>
          {bio}
        </Text>

        <TouchableOpacity
          onPress={onCompare}
          style={{ backgroundColor:'#a855f7', paddingVertical:14, borderRadius:12, alignItems:'center' }}>
          <Text style={{ color:'white', fontWeight:'700' }}>💗 Compare Photos Side by Side</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
