import 'regenerator-runtime/runtime';
 import React, { useContext } from 'react';

import SectionHeader from '@/components/section-header@1.0.2';
import Header from '@/components/header@1.0.3';
import Section from '@/components/section@1.0.5';
import BannerBubble from '@/components/banner-bubble@1.0.7';
import LayoutCard from '@/components/layout-card@1.0.3';
import CardSolution from '@/components/card-solution@1.0.6';
import Footer from '@/components/footer@1.0.2';

 import { PlatformContext } from '@/contexts/platform.context';

export default function Main() {
  const platformContext = useContext(PlatformContext);

	return (
	  <>
	    <SectionHeader {...platformContext}  id=""><Header {...platformContext}  menuId="1820" handbookIdServices="8068" handbookIdCategories="8005"></Header></SectionHeader><Section {...platformContext}  id="" title="" widthContent="auto" paddingTop="standard" paddingBottom="standard" linkText="" linkUrl="" linkTarget="_self" isHidden={false}><BannerBubble {...platformContext}  title="Облако для бизнеса и разработки" description="" btnText="Оставить заявку" btnHref="#form-consult" btnTarget="_self" isHidden={false}></BannerBubble></Section><Section {...platformContext}  id="" title="" widthContent="auto" paddingTop="standard" paddingBottom="standard" linkText="" linkUrl="" linkTarget="_self"><LayoutCard {...platformContext}  grid="1-768-2-1024-4[2]" verticalGap="8-768-16" horizontalGap="8-768-16" isEnablePagination={false} buttonText="" countStepForShowMore={0}><CardSolution {...platformContext}  design="text" title="Надежность" description="Геораспределенное облако построенное на базе Дата-Центров Tier III, для отказоустойчивых решений" icon="burger" btnText="" href="" target="_self"></CardSolution><CardSolution {...platformContext}  design="text" title="Эффективность" description="Оптимизация временных и финансовых затрат для создания вашей инфраструктуры" icon="arrow-double-right" btnText="" href="" target="_self"></CardSolution><CardSolution {...platformContext}  design="text" title="Прозрачность" description="Доступные инструменты аналитики и прогнозирования потребления ресурсов, Оплата ресурсов по факту потребления" icon="cloud" btnText="" href="" target="_self"></CardSolution><CardSolution {...platformContext}  design="text" title="Удобство" description="Единый интерфейс управления облачными сервисами и инфраструктурой,  техническая поддержка 24/7" icon="cards" btnText="" href="" target="_self"></CardSolution><CardSolution {...platformContext}  design="text" title="Развитие" description="Широкий портфель сервисов и индивидуальный подход к внедрению" icon="tiles" btnText="" href="" target="_self"></CardSolution><CardSolution {...platformContext}  design="text" title="Гибкость" description="Выбирайте удобную модель реализации: Публичное, Гибридное, Частное и Отчуждаемое облако" icon="laps" btnText="" href="" target="_self"></CardSolution></LayoutCard></Section><Section {...platformContext}  id="" title="" widthContent="auto" paddingTop="standard" paddingBottom="standard" linkText="" linkUrl="" linkTarget="_self"><Footer {...platformContext}  menuId="1822"></Footer></Section>
     </>
	);
}