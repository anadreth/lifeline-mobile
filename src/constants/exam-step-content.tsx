import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from './colors';

// Define styled components for step content
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.paragraph}>{children}</Text>
);

const BulletPoint = ({ text }: { text: string }) => (
  <View style={styles.bulletPointContainer}>
    <View style={styles.bullet} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

// Define content for each exam step
export const examStepContent: Record<string, React.ReactNode> = {
  // Step 1: Eye Examination (Vyšetrenie zraku)
  '1': (
    <>
      <Section title="Účel vyšetrenia">
        <Paragraph>
          Vyšetrenie zraku slúži na posúdenie zrakovej ostrosti, zorného poľa a celkového stavu zrakového aparátu pacienta. 
          Včasné zistenie zrakových porúch môže predísť trvalému poškodeniu zraku.
        </Paragraph>
      </Section>

      <Section title="Priebeh vyšetrenia">
        <Paragraph>Pomocou asistenta AI budú vykonané nasledujúce testy:</Paragraph>
        <BulletPoint text="Snellenov test zrakovej ostrosti - hodnotí schopnosť rozpoznať znaky na rôznych vzdialenostiach" />
        <BulletPoint text="Konfrontačný test zorného poľa - vyšetruje rozsah periférneho videnia" />
        <BulletPoint text="HIRSCHBERG test - posúdenie paralelnej pozície očí" />
        <BulletPoint text="Hodnotenie farbovidenia - schopnosť rozlíšiť farby" />
      </Section>

      <Section title="Inštrukcie pre pacienta">
        <Paragraph>Počas vyšetrenia:</Paragraph>
        <BulletPoint text="Postupujte podľa pokynov AI asistenta" />
        <BulletPoint text="Snažte sa nemrkať pri testoch zrakovej ostrosti" />
        <BulletPoint text="Upozornite na akékoľvek zrakové problémy, ktoré máte" />
        <BulletPoint text="Pokúste sa mať tvár v stabilnej pozícii pred kamerou" />
      </Section>
    </>
  ),

  // Step 2: Hearing Examination (Vyšetrenie sluchu)
  '2': (
    <>
      <Section title="Účel vyšetrenia">
        <Paragraph>
          Vyšetrenie sluchu slúži na posúdenie schopnosti počuť zvuky rôznych frekvencií a intenzít. 
          Toto vyšetrenie môže odhaliť poruchy sluchu, ktoré môžu mať vplyv na komunikáciu a kvalitu života.
        </Paragraph>
      </Section>

      <Section title="Priebeh vyšetrenia">
        <Paragraph>AI asistent vykoná nasledujúce testy:</Paragraph>
        <BulletPoint text="Weber test - hodnotenie prenosu zvuku cez kosť lebky" />
        <BulletPoint text="Rinné test - porovnanie vzdušného a kostného vedenia zvuku" />
        <BulletPoint text="Audiometrické vyšetrenie - testovanie rozsahu počuteľných frekvencií" />
        <BulletPoint text="Vyšetrenie schopnosti rozumieť hovorenému slovu" />
      </Section>

      <Section title="Inštrukcie pre pacienta">
        <BulletPoint text="Uistite sa, že je v miestnosti ticho" />
        <BulletPoint text="Použite kvalitné slúchadlá pre optimálne výsledky" />
        <BulletPoint text="Reagujte presne podľa pokynov AI asistenta" />
        <BulletPoint text="Upozornite na akékoľvek sluchové problémy, ktoré máte" />
      </Section>
    </>
  ),

  // Step 3: Heart Auscultation (Auskultácia srdca)
  '3': (
    <>
      <Section title="Účel vyšetrenia">
        <Paragraph>
          Auskultácia srdca je metóda vyšetrenia, pri ktorej sa pomocou fonendoskopu počúvajú zvuky 
          produkované srdcom. Toto vyšetrenie pomáha odhaliť šelesty, nepravidelný rytmus a iné abnormality.
        </Paragraph>
      </Section>

      <Section title="Priebeh vyšetrenia">
        <Paragraph>AI asistent bude hodnotiť nasledujúce aspekty srdcovej činnosti:</Paragraph>
        <BulletPoint text="Srdcové ozvy S1 a S2 - ich intenzita a časovanie" />
        <BulletPoint text="Prítomnosť šelestov alebo prídavných oziev" />
        <BulletPoint text="Pravidelnosť srdcového rytmu" />
        <BulletPoint text="Frekvencia srdca (tepová frekvencia)" />
      </Section>

      <Section title="Inštrukcie pre pacienta">
        <BulletPoint text="Odhaľte si hrudník alebo majte na sebe tenký odev" />
        <BulletPoint text="Dýchajte pokojne a zhlboka podľa inštrukcií" />
        <BulletPoint text="V niektorých momentoch možno budete požiadaný/á zadržať dych" />
        <BulletPoint text="Zostaňte v pokojnej pozícii pre presné meranie" />
      </Section>
    </>
  ),

  // Step 4: Lung Auscultation (Auskultácia pľúc)
  '4': (
    <>
      <Section title="Účel vyšetrenia">
        <Paragraph>
          Auskultácia pľúc je vyšetrenie dýchacích zvukov pomocou fonendoskopu. Umožňuje 
          zhodnotiť priechodnosť dýchacích ciest a odhaliť prítomnosť tekutiny alebo zápalovej aktivity.
        </Paragraph>
      </Section>

      <Section title="Priebeh vyšetrenia">
        <Paragraph>AI asistent sa zameria na hodnotenie:</Paragraph>
        <BulletPoint text="Normálnych a vedľajších dýchacích fenoménov" />
        <BulletPoint text="Prítomnosti chrôpkov, piskotov alebo trenia" />
        <BulletPoint text="Symetrie dýchania na oboch stranách hrudníka" />
        <BulletPoint text="Frekvencie a hĺbky dýchania" />
      </Section>

      <Section title="Inštrukcie pre pacienta">
        <BulletPoint text="Dýchajte zhlboka cez ústa, keď vás o to AI asistent požiada" />
        <BulletPoint text="Odkašlite si, ak dostanete takú inštrukciu" />
        <BulletPoint text="Narovnajte sa v sede pre lepšiu expanziu hrudníka" />
        <BulletPoint text="Upozornite na akékoľvek respiračné problémy, ktoré máte" />
      </Section>
    </>
  ),

  // Step 5: Abdominal Palpation (Palpácia brucha)
  '5': (
    <>
      <Section title="Účel vyšetrenia">
        <Paragraph>
          Palpácia brucha je vyšetrenie, pri ktorom sa rukami vyšetruje brušná dutina 
          s cieľom zistiť citlivosť, napätie, alebo prítomnosť abnormálnych útvarov.
        </Paragraph>
      </Section>

      <Section title="Priebeh vyšetrenia">
        <Paragraph>AI asistent vás prevedie nasledujúcimi krokmi:</Paragraph>
        <BulletPoint text="Povrchová palpácia všetkých kvadrantov brucha" />
        <BulletPoint text="Hlboká palpácia so zameraním na orgány (pečeň, slezina)" />
        <BulletPoint text="Vyšetrenie prípadnej citlivosti alebo bolestivosti" />
        <BulletPoint text="Hodnotenie peristaltiky a napätia brušnej steny" />
      </Section>

      <Section title="Inštrukcie pre pacienta">
        <BulletPoint text="Ľahnite si na chrbát s mierne pokrčenými nohami" />
        <BulletPoint text="Uvoľnite brušné svaly hlbokým a pravidelným dýchaním" />
        <BulletPoint text="Informujte o akejkoľvek bolesti počas vyšetrenia" />
        <BulletPoint text="Zdržte sa jedla 2-3 hodiny pred vyšetrením pre optimálne výsledky" />
      </Section>
    </>
  ),

  // Step 6: Gait Examination (Vyšetrenie chôdze)
  '6': (
    <>
      <Section title="Účel vyšetrenia">
        <Paragraph>
          Vyšetrenie chôdze hodnotí spôsob, akým sa človek pohybuje, čo môže odhaliť 
          problémy s nervovým systémom, svalovou silou, rovnováhou alebo ortopedické problémy.
        </Paragraph>
      </Section>

      <Section title="Priebeh vyšetrenia">
        <Paragraph>AI asistent bude analyzovať nasledujúce aspekty vašej chôdze:</Paragraph>
        <BulletPoint text="Rytmus a symetria krokov" />
        <BulletPoint text="Šírka základne pri chôdzi" />
        <BulletPoint text="Pohyb panvy a rúk počas chôdze" />
        <BulletPoint text="Stabilita a rovnováha pri otáčaní sa" />
      </Section>

      <Section title="Inštrukcie pre pacienta">
        <BulletPoint text="Choďte prirodzeným tempom na rovnom povrchu" />
        <BulletPoint text="Otočte sa na mieste, keď vás o to AI asistent požiada" />
        <BulletPoint text="Podľa možností sa postavte na špičky a potom na päty" />
        <BulletPoint text="Vykonajte tandemovú chôdzu (krok za krokom v jednej línii)" />
      </Section>
    </>
  ),

  // Step 7: Skin Inspection (Inšpekcia kože)
  '7': (
    <>
      <Section title="Účel vyšetrenia">
        <Paragraph>
          Inšpekcia kože zahŕňa dôkladné prezretie kožného povrchu s cieľom identifikovať 
          znamienka, lézie, vyrážky alebo iné kožné zmeny, ktoré môžu naznačovať zdravotné problémy.
        </Paragraph>
      </Section>

      <Section title="Priebeh vyšetrenia">
        <Paragraph>AI asistent sa zameria na hodnotenie:</Paragraph>
        <BulletPoint text="Farba a textúra kože" />
        <BulletPoint text="Prítomnosť a charakter znamienok alebo lézií" />
        <BulletPoint text="Symetria kožných zmien" />
        <BulletPoint text="Posúdenie podozrivých útvarov podľa ABCDE pravidla (Asymetria, Okraje, Farba, Priemer, Evolúcia)" />
      </Section>

      <Section title="Inštrukcie pre pacienta">
        <BulletPoint text="Ukážte oblasti kože, ktoré vás znepokojujú" />
        <BulletPoint text="Používajte dobré osvetlenie počas vyšetrenia" />
        <BulletPoint text="Pre lepšie posúdenie môžete použiť priblíženie kamery" />
        <BulletPoint text="Informujte o akýchkoľvek zmenách znamienok alebo nových útvaroch na koži" />
      </Section>
    </>
  ),

  // Step 8: Reflex Test (Test reflexov)
  '8': (
    <>
      <Section title="Účel vyšetrenia">
        <Paragraph>
          Test reflexov hodnotí funkčnosť nervových dráh medzi svalmi a miechou. 
          Abnormálne reflexy môžu indikovať problémy s nervovým systémom.
        </Paragraph>
      </Section>

      <Section title="Priebeh vyšetrenia">
        <Paragraph>AI asistent vás prevedie testovaním nasledujúcich reflexov:</Paragraph>
        <BulletPoint text="Patelárny reflex (kolenný šľachový reflex)" />
        <BulletPoint text="Achillov reflex (reflex Achillovej šľachy)" />
        <BulletPoint text="Bicepsový reflex (reflex dvojhlavého ramena)" />
        <BulletPoint text="Tricepsový reflex (reflex trojhlavého ramena)" />
      </Section>

      <Section title="Inštrukcie pre pacienta">
        <BulletPoint text="Uvoľnite sa a nechajte svaly prirodzene relaxované" />
        <BulletPoint text="Pre kolenný reflex sa posaďte tak, aby nohy viseli voľne" />
        <BulletPoint text="Pre reflexy horných končatín položte ruku do odporúčanej pozície" />
        <BulletPoint text="Pomoc druhej osoby s neurologickým kladivkom môže zlepšiť presnosť vyšetrenia" />
      </Section>
    </>
  ),

  // Step 9: Anamnesis (Anamnéza)
  '9': (
    <>
      <Section title="Účel vyšetrenia">
        <Paragraph>
          Anamnéza je rozhovor lekára s pacientom zameraný na získanie informácií o zdravotnom 
          stave, prekonaných ochoreniach, liekoch, alergii a rodinnej histórii chorôb.
        </Paragraph>
      </Section>

      <Section title="Priebeh vyšetrenia">
        <Paragraph>AI asistent bude klásť otázky zamerané na:</Paragraph>
        <BulletPoint text="Osobná anamnéza - prekonané choroby a operácie" />
        <BulletPoint text="Rodinná anamnéza - výskyt chorôb u príbuzných" />
        <BulletPoint text="Lieková anamnéza - užívané lieky a alergie" />
        <BulletPoint text="Sociálna a pracovná anamnéza - životný štýl a pracovné prostredie" />
      </Section>

      <Section title="Inštrukcie pre pacienta">
        <BulletPoint text="Odpovedajte čo najpresnejšie na otázky AI asistenta" />
        <BulletPoint text="Nezabudnite spomenúť všetky lieky, ktoré užívate" />
        <BulletPoint text="Uveďte všetky svoje alergie a intolerancie" />
        <BulletPoint text="Informujte o akýchkoľvek závažných ochoreniach vo vašej rodine" />
      </Section>
    </>
  ),
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    marginBottom: 16,
  },
  bulletPointContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },
});
