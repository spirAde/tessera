import 'regenerator-runtime/runtime';
 import React, { useContext } from 'react';
 import { Helmet } from 'react-helmet';

import SectionHeader from '@/components/section-header@1.0.2';
import Header from '@/components/header@1.0.3';
import Section from '@/components/section@1.0.5';
import BannerHead from '@/components/banner-head@1.0.5';
import Footer from '@/components/footer@1.0.2';

 import { ProjectContext } from '@/contexts/ProjectContext/ProjectContext';

export default function PageService() {
  const projectContext = useContext(ProjectContext);

	return (
	  <>
	    
    <Helmet>
      <title>ИТ-сервисы и облачные услуги в Москве: бизнес-модели SaaS и IaaS | Техносерв Cloud</title>
      <link rel="canonical" href="/service" />
      <meta name="description" content="ИТ-сервисы и облачные услуги в Москве: бизнес-модели SaaS и IaaS – купить в компании Техносерв Cloud. Предоставление облачных интернет-сервисов для предприятий. Передовые технологии" />
      <meta name="keywords" content="" />
      
    </Helmet>
  <SectionHeader {...projectContext}  id=""><Header {...projectContext}  menuId="1820" handbookIdServices="8068" handbookIdCategories="8005"></Header></SectionHeader><Section {...projectContext}  id="" title="" widthContent="auto" paddingTop="standard" paddingBottom="none" linkText="" linkUrl="" linkTarget="_self"><BannerHead {...projectContext}  title="Сервисы" description="" subDescription="" btnMainText="" btnMainHref="" btnMainTarget="_self" btnSecondText="" btnSecondHref="" btnSecondTarget="_self" image="" imageType="inContent"></BannerHead></Section><Section {...projectContext}  id="" title="" widthContent="auto" paddingTop="standard" paddingBottom="standard" linkText="" linkUrl="" linkTarget="_self"><Footer {...projectContext}  menuId="1822"></Footer></Section>
     </>
	);
}