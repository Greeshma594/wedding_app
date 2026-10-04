import { router, Stack } from 'expo-router';

import { NewDressForm } from '../../components/DressForm';
import { Screen } from '../../components/ui';
import { listDresses } from '../../lib/api';
import { collectTags } from '../../lib/catalogue';
import { SECTIONS } from '../../lib/types';
import { useLoader } from '../../lib/useLoader';
import { useSection } from '../../lib/useSection';

export default function AddDressScreen() {
  const section = useSection();
  const { data: dresses } = useLoader(() => listDresses(section), [section]);

  return (
    <Screen>
      <Stack.Screen options={{ title: `Add to ${SECTIONS[section].title}` }} />
      <NewDressForm
        section={section}
        tagSuggestions={collectTags(dresses ?? [])}
        onSaved={(dress) => router.replace(`/dress/${dress.id}`)}
      />
    </Screen>
  );
}
