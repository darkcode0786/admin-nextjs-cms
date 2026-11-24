import {
  FaCalendarCheck,
  FaCheckCircle,
  FaFlask,
  FaPills,
} from "react-icons/fa";

import LocationHero from "@/components/sections/location-detail/LocationHero";
import {
  LocationHowToReach,
  LocationNearbyAreas,
  LocationScenario,
} from "@/components/sections/location-detail/LocationDetailSections";
import MedicalRegistration from "@/components/sections/MedicalRegistration";
import AboutConsultation from "@/components/sections/about-mona-dahiya/AboutConsultation";
import AboutParenthoodCta from "@/components/sections/about-mona-dahiya/AboutParenthoodCta";
import { SectionReveal, Stagger, StaggerItem } from "@/components/ui/Reveal";
import {
  ChecklistRow,
  CostFactorCard,
  FaqAccordion,
  NumberedCard,
  ProtocolCard,
  TreatmentSection,
  TreatmentSectionHeader,
  WhyPointRow,
} from "@/components/ui/treatment";
import { LinkedText } from "@/components/ui/LinkedText";
import type { LocationPageData } from "@/data/locations";

const costIconMap = {
  medicine: <FaPills className="size-3.5" />,
  lab: <FaFlask className="size-3.5" />,
  calendar: <FaCalendarCheck className="size-3.5" />,
  check: <FaCheckCircle className="size-3.5" />,
} as const;

function filled(value?: string) {
  return Boolean(value?.trim());
}

export default function LocationPageView({
  page,
}: {
  page: LocationPageData;
}) {
  const showRegistration = filled(page.registration.title) || filled(page.registration.subtitle);
  const showIndications = filled(page.indications.title) || page.indications.items.length > 0;
  const showChecklist = filled(page.checklist.title) || filled(page.checklist.subtitle) || page.checklist.items.length > 0;
  const showProtocol = filled(page.protocol.title) || page.protocol.items.length > 0;
  const showWhy = filled(page.whyConsult.title) || page.whyConsult.items.length > 0;
  const showScenario = filled(page.scenario.title) || filled(page.scenario.text) || filled(page.scenario.disclaimer);
  const showReach = filled(page.howToReach.title) || filled(page.howToReach.subtitle) || page.howToReach.clinics.length > 0;
  const showNearby = filled(page.nearbyAreas.title) || page.nearbyAreas.items.length > 0;
  const showCost = filled(page.costFactors.title) || filled(page.costFactors.subtitle) || page.costFactors.items.length > 0;
  const showFaq = filled(page.faq.title) || page.faq.items.length > 0;
  const showConsultation =
    filled(page.consultation.title) ||
    filled(page.consultation.subtitle) ||
    filled(page.consultation.consultationDuration) ||
    filled(page.consultation.defaultClinic);

  return (
    <main className="flex min-h-screen flex-col bg-pink">
      <LocationHero hero={page.hero} />

      {showRegistration ? (
      <SectionReveal>
        <MedicalRegistration
          title={page.registration.title}
          subtitle={page.registration.subtitle}
        />
      </SectionReveal>
      ) : null}

      {showIndications ? (
      <SectionReveal delay={0.04}>
        <TreatmentSection>
          <TreatmentSectionHeader
            eyebrow={page.indications.eyebrow}
            title={page.indications.title}
          />
          <Stagger
            delay={0.04}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
          >
            {page.indications.items.map((item) => (
              <StaggerItem key={item.number}>
                <NumberedCard
                  number={String(item.number)}
                  title={item.title}
                  description={<LinkedText text={item.description} />}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </TreatmentSection>
      </SectionReveal>
      ) : null}

      {showChecklist ? (
      <SectionReveal delay={0.04}>
        <TreatmentSection>
          <TreatmentSectionHeader
            eyebrow={page.checklist.eyebrow}
            title={page.checklist.title}
            subtitle={<LinkedText text={page.checklist.subtitle} />}
          />
          <Stagger delay={0.04} className="mt-7 space-y-3">
            {page.checklist.items.map((item, index) => (
              <StaggerItem key={`${item.title}-${index}`}>
                <ChecklistRow title={item.title} text={<LinkedText text={item.description} />} />
              </StaggerItem>
            ))}
          </Stagger>
        </TreatmentSection>
      </SectionReveal>
      ) : null}

      {showProtocol ? (
      <SectionReveal delay={0.04}>
        <TreatmentSection>
          <TreatmentSectionHeader
            eyebrow={page.protocol.eyebrow}
            title={page.protocol.title}
          />
          <Stagger
            delay={0.04}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
          >
            {page.protocol.items.map((item) => (
              <StaggerItem key={item.step}>
                <ProtocolCard
                  number={String(item.step)}
                  title={item.title}
                  bullets={[<LinkedText key={item.step} text={item.description} />]}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </TreatmentSection>
      </SectionReveal>
      ) : null}

      {showWhy ? (
      <SectionReveal delay={0.04}>
        <TreatmentSection>
          <TreatmentSectionHeader
            eyebrow={page.whyConsult.eyebrow}
            title={page.whyConsult.title}
          />
          <Stagger delay={0.04} className="mt-7 space-y-3.5">
            {page.whyConsult.items.map((item, index) => (
              <StaggerItem key={`${item.title}-${index}`}>
                <WhyPointRow
                  title={item.title}
                  desc={<LinkedText text={item.description} />}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </TreatmentSection>
      </SectionReveal>
      ) : null}

      {showScenario ? (
      <SectionReveal delay={0.04}>
        <LocationScenario scenario={page.scenario} />
      </SectionReveal>
      ) : null}

      {showReach ? (
      <SectionReveal delay={0.04}>
        <LocationHowToReach howToReach={page.howToReach} />
      </SectionReveal>
      ) : null}

      {showNearby ? (
      <SectionReveal delay={0.04}>
        <LocationNearbyAreas nearbyAreas={page.nearbyAreas} />
      </SectionReveal>
      ) : null}

      {showCost ? (
      <SectionReveal delay={0.04}>
        <TreatmentSection>
          <TreatmentSectionHeader
            eyebrow={page.costFactors.eyebrow}
            title={page.costFactors.title}
            subtitle={page.costFactors.subtitle}
          />
          <Stagger
            delay={0.04}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
          >
            {page.costFactors.items.map((item, index) => (
              <StaggerItem key={`${item.title}-${index}`}>
                <CostFactorCard
                  icon={costIconMap[item.icon]}
                  title={item.title}
                  description={<LinkedText text={item.description} />}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </TreatmentSection>
      </SectionReveal>
      ) : null}

      {showFaq ? (
      <SectionReveal delay={0.04}>
        <TreatmentSection>
          <TreatmentSectionHeader
            eyebrow={page.faq.eyebrow}
            title={page.faq.title}
            subtitle={page.faq.subtitle}
          />
          <div className="mt-7">
            <FaqAccordion
              items={page.faq.items.map((item) => ({
                ...item,
                answer: <LinkedText text={item.answer} />,
              }))}
              includeSchema={false}
            />
          </div>
        </TreatmentSection>
      </SectionReveal>
      ) : null}

      {showConsultation ? (
      <SectionReveal delay={0.04}>
        <AboutConsultation
          sectionId={page.consultation.sectionId}
          eyebrow={page.consultation.eyebrow}
          title={page.consultation.title}
          subtitle={page.consultation.subtitle}
          appendContacts={false}
          consultationDuration={page.consultation.consultationDuration}
          defaultClinic={page.consultation.defaultClinic}
        />
      </SectionReveal>
      ) : null}

      <SectionReveal delay={0.04}>
        <AboutParenthoodCta />
      </SectionReveal>
    </main>
  );
}
