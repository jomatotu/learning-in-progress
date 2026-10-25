import { defineMessages } from '@/lib/i18n'

// Display texts for the form's fixed choices. The keys are the values we store and send to the server,
// so the profile JSON stays the same in both languages; only what the student sees changes.
export const optionMessages = defineMessages({
  en: {
    stages: {
      School: {
        label: 'School',
        detailLabel: 'Which grade are you in?',
        detailPlaceholder: 'Grade 10',
      },
      'Vocational training': {
        label: 'Vocational training',
        detailLabel: 'What are you training as?',
        detailPlaceholder: 'Electronics technician',
      },
      University: {
        label: 'University',
        detailLabel: 'What do you study?',
        detailPlaceholder: 'Biology, 2nd semester',
      },
      'Something else': {
        label: 'Something else',
        detailLabel: 'Tell us a bit more',
        detailPlaceholder: 'Evening class in Spanish',
      },
    },
    goalTypes: {
      'Pass an exam': 'Pass an exam',
      'Understand a topic': 'Understand a topic',
      'Finish homework': 'Finish homework',
      'Keep up in class': 'Keep up in class',
    },
    likes: {
      'Short videos': 'Short videos',
      'Examples first': 'Examples first',
      'Text read aloud': 'Text read aloud',
      'Quizzes to check myself': 'Quizzes to check myself',
      'Small steps with breaks': 'Small steps with breaks',
      'Pictures and diagrams': 'Pictures and diagrams',
      'Talking it through': 'Talking it through',
      'Less text on the screen': 'Less text on the screen',
    },
    steps: {
      about: 'About you',
      goal: 'Your goal',
      survey: 'How you learn',
      notes: 'Your notes',
      review: 'Check your profile',
    },
  },
  de: {
    stages: {
      School: {
        label: 'Schule',
        detailLabel: 'In welcher Klasse bist du?',
        detailPlaceholder: 'Klasse 10',
      },
      'Vocational training': {
        label: 'Ausbildung',
        detailLabel: 'Als was machst du deine Ausbildung?',
        detailPlaceholder: 'Elektroniker',
      },
      University: {
        label: 'Studium',
        detailLabel: 'Was studierst du?',
        detailPlaceholder: 'Biologie, 2. Semester',
      },
      'Something else': {
        label: 'Etwas anderes',
        detailLabel: 'Erzähl uns etwas mehr',
        detailPlaceholder: 'Abendkurs Spanisch',
      },
    },
    goalTypes: {
      'Pass an exam': 'Eine Prüfung bestehen',
      'Understand a topic': 'Ein Thema verstehen',
      'Finish homework': 'Hausaufgaben schaffen',
      'Keep up in class': 'Im Unterricht mitkommen',
    },
    likes: {
      'Short videos': 'Kurze Videos',
      'Examples first': 'Zuerst Beispiele',
      'Text read aloud': 'Vorgelesener Text',
      'Quizzes to check myself': 'Quizze zum Selbsttest',
      'Small steps with breaks': 'Kleine Schritte mit Pausen',
      'Pictures and diagrams': 'Bilder und Diagramme',
      'Talking it through': 'Darüber reden',
      'Less text on the screen': 'Weniger Text auf dem Bildschirm',
    },
    steps: {
      about: 'Über dich',
      goal: 'Dein Ziel',
      survey: 'Wie du lernst',
      notes: 'Deine Notizen',
      review: 'Profil prüfen',
    },
  },
})

// Looks up a stored value's display text, if it's one of ours.
export function entryFor<T>(
  map: Record<string, T>,
  value: string,
): T | undefined {
  return map[value]
}

// The translated label for a stored value, or the value itself if it isn't one of ours.
export function labelFor(labels: Record<string, string>, value: string) {
  return entryFor(labels, value) ?? value
}
