import { router, Stack } from 'expo-router';
import { RefreshControl, Text } from 'react-native';

import { DressGrid } from '../../components/dress';
import { Button, EmptyState, Loading, Message, Screen } from '../../components/ui';
import { listDresses } from '../../lib/api';
import { SECTIONS } from '../../lib/types';
import { useLoader } from '../../lib/useLoader';
import { useSection } from '../../lib/useSection';
import { type } from '../../theme';

export default function CatalogueScreen() {
  const section = useSection();
  const { data: dresses, error, loading, reload } = useLoader(() => listDresses(section), [section]);

  if (loading && !dresses) return <Loading />;

  return (
    <Screen refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}>
      <Stack.Screen options={{ title: `${SECTIONS[section].title} catalogue` }} />
      <Button label="+ Add dress" onPress={() => router.push(`/${section}/add-dress`)} />
      {error ? <Message>{error}</Message> : null}
      {dresses && dresses.length === 0 ? (
        <EmptyState title="No dresses yet" body="Add a dress with its photo and details. It appears here straight away." />
      ) : null}
      {dresses && dresses.length > 0 ? (
        <>
          <Text style={type.small}>
            {dresses.length} {dresses.length === 1 ? 'dress' : 'dresses'}
          </Text>
          <DressGrid dresses={dresses} onPress={(d) => router.push(`/dress/${d.id}`)} />
        </>
      ) : null}
    </Screen>
  );
}
