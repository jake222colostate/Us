import React from 'react';
import { FlatList, View } from 'react-native';
import { BOTS } from '../../mock/bots';
import Card from '../../components/Card';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

export default function FeedScreen() {
  const nav = useNavigation<NativeStackNavigationProp<any>>();
  return (
    <View style={{ flex:1, backgroundColor:'#0b1220', paddingBottom:60 }}>
      <FlatList
        data={BOTS}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <Card
            name={item.name}
            age={item.age}
            distanceMi={item.distanceMi}
            bio={item.bio}
            avatar={item.avatar}
            photo={item.photos[0]}
            onCompare={() => nav.navigate('Compare', { left: item.photos[0], right: item.photos[1] || item.photos[0] })}
          />
        )}
      />
    </View>
  );
}
