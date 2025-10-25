import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface Step {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  toastText: string;
}

export interface ExamSection {
  title: string;
  data: Step[];
  index: number;
}

export const EXAM_DATA: Omit<ExamSection, 'index'>[] = [
  {
    title: 'Hlava a krk',
    data: [
      { id: '1', icon: 'eye-outline', title: 'Vyšetrenie zraku', description: 'Kontrola zrakovej ostrosti a zorného poľa.', toastText: 'Vyšetrenie zraku dokončené' },
      { id: '2', icon: 'ear-hearing', title: 'Vyšetrenie sluchu', description: 'Základné audiometrické testy.', toastText: 'Vyšetrenie sluchu dokončené' },
    ],
  },
  {
    title: 'Hrudník',
    data: [
      { id: '3', icon: 'stethoscope', title: 'Auskultácia srdca', description: 'Počúvanie srdcových oziev.', toastText: 'Auskultácia srdca dokončená' },
      { id: '4', icon: 'lungs', title: 'Auskultácia pľúc', description: 'Počúvanie dýchacích fenoménov.', toastText: 'Auskultácia pľúc dokončená' },
    ],
  },
  {
    title: 'Brucho',
    data: [
      { id: '5', icon: 'hand-heart-outline', title: 'Palpácia brucha', description: 'Vyšetrenie pohmatom na zistenie citlivosti.', toastText: 'Palpácia brucha dokončená' },
    ],
  },
  {
    title: 'Končatiny',
    data: [
        { id: '6', icon: 'walk', title: 'Vyšetrenie chôdze', description: 'Analýza stereotypu chôdze.', toastText: 'Vyšetrenie chôdze dokončené' },
    ],
  },
  {
    title: 'Koža',
    data: [
        { id: '7', icon: 'camera-outline', title: 'Inšpekcia kože', description: 'Vizuálna kontrola znamienok a lézií.', toastText: 'Inšpekcia kože dokončená' },
    ],
  },
  {
    title: 'Nervový systém',
    data: [
        { id: '8', icon: 'hand-pointing-up', title: 'Test reflexov', description: 'Skúška základných reflexov.', toastText: 'Test reflexov dokončený' },
    ],
  },
  {
    title: 'Zvyšné funkcie',
    data: [
        { id: '9', icon: 'head-question-outline', title: 'Anamnéza', description: 'Doplňujúce otázky k zdravotnému stavu.', toastText: 'Anamnéza dokončená' },
    ],
  },
];

export const sectionsWithIndex: ExamSection[] = EXAM_DATA.map((section, index) => ({ ...section, index }));
export const totalSteps = sectionsWithIndex.reduce((acc, section) => acc + section.data.length, 0);
