import { emptyProfile, type Profile } from '@/features/application/profile'

// Ready-made students for the jury demo: /?demo=peter opens the form filled in, at the review step.
// Stage, goal type and likes use the stored keys from options.ts; the free texts are German.
type Persona = {
  id: string
  line: string
  profile: Partial<Profile>
}

export const personas: Persona[] = [
  {
    id: 'peter',
    line: 'Klasse 10, Photosynthese. Kommt nicht ins Anfangen und verliert nach einer Seite Text den Faden.',
    profile: {
      name: 'Peter',
      stage: 'School',
      stageDetail: 'Klasse 10',
      interests: 'Minecraft, mit Freunden zocken',
      goalType: 'Finish homework',
      goal: 'Hausaufgaben in unter 45 Minuten schaffen',
      topic: 'Photosynthese',
      text:
        'Photosynthese: Pflanzen stellen ihre Nahrung selbst her. In den Chloroplasten der Blattzellen fängt der grüne Farbstoff Chlorophyll Lichtenergie ein. ' +
        'Mit dieser Energie bauen die Pflanzen aus Kohlenstoffdioxid aus der Luft und Wasser aus dem Boden Traubenzucker (Glucose) auf. ' +
        'Dabei entsteht Sauerstoff, den die Pflanze über die Spaltöffnungen an die Luft abgibt. ' +
        'Die Gesamtgleichung lautet: 6 CO2 + 6 H2O + Lichtenergie → C6H12O6 + 6 O2. ' +
        'Die Photosynthese läuft in zwei Schritten ab: In der lichtabhängigen Reaktion wird Wasser gespalten, und die Energie wird in Form von ATP und NADPH gespeichert. ' +
        'Im Calvin-Zyklus nutzt die Pflanze diese Energie, um Kohlenstoffdioxid in Zucker einzubauen. ' +
        'Ohne Photosynthese gäbe es keinen Sauerstoff in der Atmosphäre und keine Nahrung für Tiere und Menschen.',
      likes: ['Short videos', 'Small steps with breaks'],
      hard: 'Ich fang einfach nicht an. Und nach einer Seite Text weiß ich nicht mehr, was drinstand.',
    },
  },
  {
    id: 'lena',
    line: 'Pflegeausbildung, 1. Jahr, Blutkreislauf. Lange Texte verrutschen, Zuhören klappt viel besser.',
    profile: {
      name: 'Lena',
      stage: 'Vocational training',
      stageDetail: 'Pflegefachfrau, 1. Jahr',
      interests: 'Musik, Podcasts, Tanzen',
      goalType: 'Pass an exam',
      goal: 'Die Zwischenprüfung schaffen, ohne jeden Abend stundenlang zu lesen',
      topic: 'Der Blutkreislauf',
      text: 'Der Blutkreislauf: Das Herz pumpt das Blut durch zwei Kreisläufe. Im Lungenkreislauf fließt sauerstoffarmes Blut von der rechten Herzkammer zur Lunge. Dort gibt es Kohlenstoffdioxid ab und nimmt Sauerstoff auf. Das sauerstoffreiche Blut fließt zurück in den linken Vorhof. Im Körperkreislauf pumpt die linke Herzkammer das Blut über die Aorta in den ganzen Körper. In den Kapillaren gibt es Sauerstoff und Nährstoffe an die Zellen ab. Über die Venen kehrt das Blut zum rechten Vorhof zurück. Herzklappen sorgen dafür, dass das Blut nur in eine Richtung fließt.',
      likes: ['Text read aloud', 'Pictures and diagrams'],
      hard: 'Lange Texte. Ich lese einen Satz dreimal und die Wörter verrutschen. Zuhören geht viel besser.',
    },
  },
  {
    id: 'amir',
    line: 'Klasse 8, Bruchrechnung. Rechnen klappt, aber die vielen deutschen Wörter in den Textaufgaben bremsen.',
    profile: {
      name: 'Amir',
      stage: 'School',
      stageDetail: 'Klasse 8',
      interests: 'Fußball, FIFA spielen',
      goalType: 'Keep up in class',
      goal: 'Die Textaufgaben verstehen, rechnen kann ich',
      topic: 'Bruchrechnung',
      text: 'Bruchrechnung: Ein Bruch beschreibt einen Teil eines Ganzen. Der Nenner unten sagt, in wie viele gleich große Teile das Ganze geteilt wird. Der Zähler oben sagt, wie viele dieser Teile gemeint sind. Bei 3/4 ist das Ganze in vier Teile geteilt, und drei davon sind gemeint. Brüche mit gleichem Nenner addiert man, indem man die Zähler addiert: 1/4 + 2/4 = 3/4. Haben Brüche verschiedene Nenner, macht man sie zuerst gleichnamig, zum Beispiel 1/2 = 2/4. Aufgabe: Ein Team spielt 4 Viertel. In der ersten Hälfte sind 2 Viertel vorbei. Welcher Bruch des Spiels fehlt noch?',
      likes: ['Examples first', 'Less text on the screen'],
      hard: 'Die Aufgaben haben so viele deutsche Wörter. Bis ich den Satz verstehe, ist die Stunde vorbei.',
    },
  },
]

// The full form profile for ?demo=<id>, or null for a missing or unknown id.
export function demoProfile(id: string | null): Profile | null {
  const persona = personas.find((p) => p.id === id)
  return persona ? { ...emptyProfile, ...persona.profile } : null
}
