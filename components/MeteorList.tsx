import React, { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { getMeteorShowers } from '../services/meteorService';

export default function MeteorList() {
  const [showers, setShowers] = useState<any[]>([]);

  useEffect(() => {
    getMeteorShowers().then(setShowers);
  }, []);

  return (
    <FlatList
      data={showers}
      keyExtractor={(item) => item.peak}
      renderItem={({ item }) => (
        <View style={{ margin: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
          <Text>Peak: {item.peak}</Text>
          <Text>Visible in: {item.visibleIn.join(', ')}</Text>
        </View>
      )}
    />
  );
}
