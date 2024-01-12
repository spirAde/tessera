import 'regenerator-runtime/runtime';
 import React, { useContext } from 'react';

import SectionHeader from '@/components/section-header@1.0.2';
import Header from '@/components/header@1.0.3';
import Section from '@/components/section@1.0.5';
import BannerHead from '@/components/banner-head@1.0.5';
import Footer from '@/components/footer@1.0.2';

 import { PlatformContext } from '@/contexts/platform.context';

export default function Cdn() {
  const platformContext = useContext(PlatformContext);

	return (
	  <>
	    <SectionHeader {...platformContext}  id=""><Header {...platformContext}  menuId="1820" handbookIdServices="8068" handbookIdCategories="8005"></Header></SectionHeader><Section {...platformContext}  id="" title="" widthContent="auto" paddingTop="standard" paddingBottom="standard" linkText="" linkUrl="" linkTarget="_self"><BannerHead {...platformContext}  showBreadcrumbs title="CDN" description=":::Text{size=medium_1}
CDN – ускорение доставки контента пользователям вашего ресурса (сайта, приложения) с помощью распределенной сети кэширующих серверов.
" subDescription="" btnMainText="Оставить заявку" btnMainHref="#form-consult" btnMainTarget="_self" btnSecondText="" btnSecondHref="" btnSecondTarget="_self" image="/media-files/T1Cloud/sitepages/service/corporate-services/disk-t1/pic-header.png" imageType="inContent" imageMobile="/media-files/T1Cloud/sitepages/service/cdn-3d-ico.png" imageDesktop="/media-files/T1Cloud/sitepages/service/cdn-3d-ico.png" imagePosition="whole"></BannerHead></Section><Section {...platformContext}  id="" title="" widthContent="auto" paddingTop="standard" paddingBottom="standard" linkText="" linkUrl="" linkTarget="_self"><Footer {...platformContext}  menuId="1822"></Footer></Section>
     </>
	);
}