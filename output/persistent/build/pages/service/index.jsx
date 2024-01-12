import 'regenerator-runtime/runtime';
 import React, { useContext } from 'react';

import SectionHeader from '@/components/section-header@1.0.2';
import Header from '@/components/header@1.0.3';
import Section from '@/components/section@1.0.5';
import BannerHead from '@/components/banner-head@1.0.5';
import Footer from '@/components/footer@1.0.2';
import SliderCase from '@/components/slider-case@1.0.3';
import SliderCaseCard from '@/components/slider-case-card@1.0.1';
import MarkdownMarkup from '@/components/markdown-markup@1.0.1';

 import { PlatformContext } from '@/contexts/platform.context';

export default function Service() {
  const platformContext = useContext(PlatformContext);

	return (
	  <>
	    <SectionHeader {...platformContext}  id=""><Header {...platformContext}  menuId="1820" handbookIdServices="8068" handbookIdCategories="8005"></Header></SectionHeader><Section {...platformContext}  id="" title="" widthContent="auto" paddingTop="standard" paddingBottom="none" linkText="" linkUrl="" linkTarget="_self"><BannerHead {...platformContext}  title="Сервисы" description="" subDescription="" btnMainText="" btnMainHref="" btnMainTarget="_self" btnSecondText="" btnSecondHref="" btnSecondTarget="_self" image="" imageType="inContent"></BannerHead></Section><Section {...platformContext}  id="" title="" widthContent="auto" paddingTop="standard" paddingBottom="standard" linkText="" linkUrl="" linkTarget="_self"><Footer {...platformContext}  menuId="1822"></Footer></Section><Section {...platformContext}  id="" title="" widthContent="auto" paddingTop="standard" paddingBottom="standard" linkText="" linkUrl="" linkTarget="_self"><SliderCase {...platformContext} ><SliderCaseCard {...platformContext}  title="Level Group повышает эффективность процессов проектирования с помощью облачных сервисов" imageLink="/media-files/T1Cloud/fragment-template/123703/phot.png" buttonLink="/about-company/cases/t1-cloud-i-datapro-predostavil-virtualnuyu-infrastrukturu-dlya-level-group/" buttonText="Подробнее" buttonTarget="_self"><MarkdownMarkup {...platformContext}  markup=":::Text{size=medium_1}
**Задача**

:Accent[Компании Level Group, одному из лидеров в области московского девелопмента, требовалось надежное и отказоустойчивое решение для выполнения бизнес-задач, связанных с проектированием объектов строительства. Во время работы над одним проектом ИТ-системами компании может генерироваться и обрабатываться огромный массив данных о самых разных параметрах проектируемого объекта. Чтобы обеспечить бесперебойный доступ к информационным ресурсам Level Group требовались вычислительные мощности более высокого уровня. ]{color=&quot;grey&quot;} 

**Решение**

:Accent[Облачный провайдер T1 Cloud предоставил Level Group высокопроизводительную инфраструктуру по модели IaaS для быстрого доступа к данным и сервисам компании, в том числе и в дистанционном формате для удаленных сотрудников. Застройщик может использовать ИТ-ресурсы нужной производительности без необходимости приобретать, настраивать и поддерживать оборудование. ]{color=&quot;grey&quot;} " color="black" mobileTextSize="inherit" tabletTextSize="inherit" desktopTextSize="inherit" isItalic={false} weight="inherit"></MarkdownMarkup></SliderCaseCard><SliderCaseCard {...platformContext}  title="T1 Cloud обеспечил Trussardi бесперебойную работу сервиса 1С" imageLink="/media-files/T1Cloud/fragment-template/123703/phot.png" buttonLink="/about-company/cases/t1-cloud-pomogaet-obespechivat-otkazoustoychivost-it-infrastruktury-trussardi/ " buttonText="Подробнее" buttonTarget="_self"><MarkdownMarkup {...platformContext}  markup=":::Text{size=medium_1}
**Задача**

:Accent[Труссарди - российское представительство оптово-розничной сети итальянского бренда Trussardi, выпускающий одежду, аксессуары и парфюмерию класса «люкс». Компании было необходимо повысить скорость работы сервиса 1C и обеспечить непрерывность его работы при любых нагрузках. ]{color=&quot;grey&quot;} 

**Решение**

:Accent[T1 Cloud развернул для Труссарди масштабируемую ИТ-инфраструктуру, где разместил систему бухгалтерского учета 1С и обеспечил круглосуточную техническую поддержку. В результате клиент имеет возможность гибко управлять вычислительными ресурсами без необходимости контроля «железа» и запускать сложные ресурсоемкие проекты, не привлекая дополнительных специалистов. ]{color=&quot;grey&quot;} " color="black" mobileTextSize="inherit" tabletTextSize="inherit" desktopTextSize="inherit" isItalic={false} weight="inherit"></MarkdownMarkup></SliderCaseCard><SliderCaseCard {...platformContext}  title="«Новатех» сократила трудозатраты в 4 раза, используя облачную инфраструктуру" imageLink="/media-files/T1Cloud/fragment-template/123703/phot.png" buttonLink="/about-company/cases/novatekh/" buttonText="Подробнее" buttonTarget="_self"><MarkdownMarkup {...platformContext}  markup=":::Text{size=medium_1}
**Задача**

:Accent[«Новатех» — ключевой поставщик информационных систем для организации эффективной инженерной деятельности ведущих промышленных холдингов России. Работа с программными продуктами «Новатех» предполагает хранение и анализ огромного массива нормативной и технической документации и требует постоянного обновления баз. Поэтому компания нуждалась в оптимальном по стоимости решении для надежного размещения и гибкого управления большими базами данных. ]{color=&quot;grey&quot;} 

**Решение**

:Accent[T1 Cloud предоставил «Новатех» защищенный сегмент виртуальной инфраструктуры на базе платформы виртуализации OpenStack, который обеспечивает высокую производительность работы информационных систем компании. Использование облачных сервисов позволило сократить трудозатраты в 4 раза, повысить удобство работы ИТ-службы и улучшить обслуживание клиентов.]{color=&quot;grey&quot;} " color="black" mobileTextSize="inherit" tabletTextSize="inherit" desktopTextSize="inherit" isItalic={false} weight="inherit"></MarkdownMarkup></SliderCaseCard><SliderCaseCard {...platformContext}  title="T1 Cloud помог Проконсим организовать удаленную работу сотрудников" imageLink="/media-files/T1Cloud/fragment-template/123703/phot.png" buttonLink="/about-company/cases/t1-cloud-virtualnyy-data-tsentr-dlya-firmy-prokonsim/" buttonText="Подробнее" buttonTarget="_self"><MarkdownMarkup {...platformContext}  markup=":::Text{size=medium_1}
**Задача**

:Accent[«Проконсим» — один из лидеров рынка сантехнического оборудования и трубопроводной арматуры в России. С учетом широкой географии присутствия – более 16 филиалов по всей стране, компании было важно обеспечить безопасный доступ к информационным ресурсам для удаленных сотрудников, а также оптимизировать затраты на поддержку ИТ-инфраструктуры.  ]{color=&quot;grey&quot;}

**Решение**

:Accent[T1 Cloud предоставил «Проконсим» сервис виртуальной инфраструктуры с защищенным подключением к удаленным рабочим столам. С помощью облачных сервисов компания смогла надежно выстроить процесс дистанционной работы и эффективную коммуникацию сотрудников.]{color=&quot;grey&quot;}" color="black" mobileTextSize="inherit" tabletTextSize="inherit" desktopTextSize="inherit" isItalic={false} weight="inherit"></MarkdownMarkup></SliderCaseCard><SliderCaseCard {...platformContext}  title="Облачная платформа обеспечивает «Бондюэль» стабильную работы ИТ-систем" imageLink="/media-files/T1Cloud/fragment-template/123703/phot.png" buttonLink="/about-company/cases/bondyuel-polzuetsya-oblakom-t1-cloud/  " buttonText="Подробнее" buttonTarget="_self"><MarkdownMarkup {...platformContext}  markup=":::Text{size=medium_1}
**Задача**

:Accent[«Бондюэль» - российский филиал крупнейшего в мире производителя консервированных и замороженных овощей.  Для организации бесперебойной работы и отказоустойчивости своих ИТ-систем компания приняла решение использовать облачную инфраструктуру в качестве резервной площадки. Одно из ключевых требований при выборе сервис-провайдера стало соответствие инфраструктуры облака требования российского законодательства ФЗ-152 «О персональных данных».]{color=&quot;grey&quot;} 

**Решение**

:Accent[Виртуальная инфраструктура и сервис облачного хранилища от T1 Cloud полностью решили задачи по хранению и резервному копированию данных «Бондюэль», что позволило обеспечить непрерывность и эффективность бизнес-процессов компании без дополнительных затрат на развертывание собственной ИТ-инфраструктуры. При этом вся информация компании размещена на территории РФ, что полностью отвечает требования законодательства.]{color=&quot;grey&quot;} " color="black" mobileTextSize="inherit" tabletTextSize="inherit" desktopTextSize="inherit" isItalic={false} weight="inherit"></MarkdownMarkup></SliderCaseCard><SliderCaseCard {...platformContext}  title="Directum повысил доступность сервисов для клиентов, используя облачную инфраструктуру" imageLink="/media-files/T1Cloud/fragment-template/123703/phot.png" buttonLink="/about-company/cases/directum-uspeshno-perevel-v-oblako-t1-cloud-servisy-zakazchikov" buttonText="Подробнее" buttonTarget="_self"><MarkdownMarkup {...platformContext}  markup=":::Text{size=medium_1}
**Задача**

:Accent[Directum — российская ИТ-компания более тридцати лет разрабатывает информационные системы и сервисы для управления цифровыми процессами и документами. C целью повышения производительности и бесперебойности работы программных продуктов компания приняла решение о миграции из одной облачной инфраструктуры в другую. Одной из ключевых требований к провайдеру стала доступность сервисов Directum для клиентов 99% времени.]{color=&quot;grey&quot;} 

**Решение**

:Accent[Для обеспечения высокого уровня обслуживания заказчиков компания Directum перенесла часть ИТ-систем в облачную инфраструктуру T1 Cloud, что обеспечило отказоустойчивость и надежность работы бизнес-приложений. При помощи специалистов провайдера миграция прошла в максимально короткий срок и бесшовно для пользователей систем Directum.]{color=&quot;grey&quot;} " color="black" mobileTextSize="inherit" tabletTextSize="inherit" desktopTextSize="inherit" isItalic={false} weight="inherit"></MarkdownMarkup></SliderCaseCard><SliderCaseCard {...platformContext}  title="LIFE PAY повышает качество сервисов для клиентов с помощью облака T1 Cloud" imageLink="/media-files/T1Cloud/fragment-template/123703/phot.png" buttonLink="/about-company/cases/kak-oblako-t1-cloud-pomogaet-life-pay-sokhranyat-vysokuyu-otkazoustoychivost-it-infrastruktury-i-gib" buttonText="Подробнее" buttonTarget="_self"><MarkdownMarkup {...platformContext}  markup=":::Text{size=medium_1}
**Задача**

:Accent[LIFE PAY — разработчик платежных, кассовых и учетных продуктов для розничного бизнеса. По мере развития бизнеса рабочая нагрузка значительно возросла. Поэтому компании требовалось более производительные вычислительные ресурсы, которые позволили бы гибко масштабировать и повысить доступность инфраструктуры и улучшить качество предоставляемых сервисов клиентам.]{color=&quot;grey&quot;} 

**Решение**

:Accent[LIFE PAY использует виртуальную инфраструктуру VMware от T1 Cloud, что обеспечивает ей высокий уровень доступности сервисов и бесперебойную работу всех высоконагруженных систем, а также позволяет снизить time-to-market новых продуктов и обновление существующих B2B-решений. Наличие у облачного провайдера сертификата PCI DSS гарантирует безопасность использования вычислительных мощностей облака для обработки и хранения данных по транзакциям клиентов финансовых и торгово-сервисных организаций от утечек и потенциальных финансовых потерь.  ]{color=&quot;grey&quot;} " color="black" mobileTextSize="inherit" tabletTextSize="inherit" desktopTextSize="inherit" isItalic={false} weight="inherit"></MarkdownMarkup></SliderCaseCard><SliderCaseCard {...platformContext}  title="Защищенная инфраструктура в соответствии с 152 -ФЗ для Bellerage Alinga" imageLink="/media-files/T1Cloud/fragment-template/123703/phot.png" buttonLink="/about-company/cases/t1-cloud-predostavil-uslugu-colocation-kompanii-bellerage-alinga" buttonText="Подробнее" buttonTarget="_self"><MarkdownMarkup {...platformContext}  markup=":::Text{size=medium_1}
**Задача**

:Accent[Bellerage Alinga – технологический лидер на рынке финансового и юридического аутсорсинга. Компании приходится работать с большим количеством документации, большая часть которой поступает в цифровом формате, увеличивая объем данных. Поэтому у компании возросла потребность в дополнительных мощностях для хранения большого информации. Одним из важных критериев при выборе оптимального решения стало соответствие будущего сервис-провайдера требованиям ФЗ-152 о локализации персональных данных пользователей на территории РФ.]{color=&quot;grey&quot;} 

**Решение**

:Accent[T1 Cloud предоставил Bellerage Alinga решение по модели Colocation на базе ЦОД уровня Tier III. Это дало компании возможность оптимизировать затраты на развертывание и обслуживание оборудования для хранения данных и позволило ей сфокусироваться на поддержке своего бизнеса и клиентов. Так как данные хранятся в ЦОД на территории РФ, это обеспечивает полное соблюдение компании требованиям закона ФЗ-152. ]{color=&quot;grey&quot;} " color="black" mobileTextSize="inherit" tabletTextSize="inherit" desktopTextSize="inherit" isItalic={false} weight="inherit"></MarkdownMarkup></SliderCaseCard><SliderCaseCard {...platformContext}  title="Аэропорт Пулково повышает эффективность процессов бэк-офиса с помощью облачных сервисов  " imageLink="/media-files/T1Cloud/fragment-template/123703/phot.png" buttonLink="/about-company/cases/t1-cloud-predostavil-oblachnye-resursy-aeroportu-pulkovo" buttonText="Подробнее" buttonTarget="_self"><MarkdownMarkup {...platformContext}  markup=":::Text{size=medium_1}
**Задача**

:Accent[Международный аэропорт Пулково – главная воздушная гавань Санкт-Петербурга, имеющая статус федерального значения. Оператором аэропорта является управляющая компания «Воздушные Ворота Северной Столицы», которая ежедневно ведет объемный документооборот с большим числом контрагентов, обрабатывая большие массивы данных. Это требует доступности и бесперебойной работы информационных систем в круглосуточном режиме.]{color=&quot;grey&quot;} 

**Решение**

:Accent[Размещение части ИТ-инфраструктуры в облаке T1 Cloud позволило Пулково обеспечить бесперебойное функционирование инфраструктуры и бизнес-приложений, а также надежность и высокую безопасность размещаемой в облаке информации. Данные хранятся в ЦОД уровня Tier III на территории РФ и защищены шифрованием, настройкой прав доступа, а также логированием всех операций.]{color=&quot;grey&quot;} " color="black" mobileTextSize="inherit" tabletTextSize="inherit" desktopTextSize="inherit" isItalic={false} weight="inherit"></MarkdownMarkup></SliderCaseCard><SliderCaseCard {...platformContext}  title="Сервис видеоконференций DION использует облачную инфраструктуру T1 Cloud" imageLink="/media-files/T1Cloud/fragment-template/123703/phot.png" buttonLink="/about-company/cases/Servis-videokonferentsiy-DION-razmestil-infrastrukturu-v-oblake-T1-Cloud" buttonText="Подробнее" buttonTarget="_self"><MarkdownMarkup {...platformContext}  markup=":::Text{size=medium_1}
**Задача**

:Accent[DION — российская платформа для корпоративных коммуникаций, предоставляющая возможность проводить видеоконференции с высоким качеством звука и изображения до 5000 пользователей на одном мероприятии. Компании требовалось организовать безотказное функционирование платформы и высокую доступность всех сервисов DION при любом количестве одновременных участников и нагрузках.]{color=&quot;grey&quot;} 

**Решение**

:Accent[T1 Cloud предоставил для DION облачную инфраструктуру по модели IaaS с гарантированным уровнем отказоустойчивости 99,95%. В результате клиент получил устойчивый бэкенд к любым нагрузкам – приложение всегда доступно конечному пользователю. Для удобного администрирования и управления инфраструктурой, DION использует услугу Managed Services, что позволяет компании практически полностью снять с себя ИТ-нагрузку. Вся настройка и обслуживание инфраструктуры лежит на стороне провайдера с круглосуточной технической поддержкой.]{color=&quot;grey&quot;} " color="black" mobileTextSize="inherit" tabletTextSize="inherit" desktopTextSize="inherit" isItalic={false} weight="inherit"></MarkdownMarkup></SliderCaseCard></SliderCase></Section>
     </>
	);
}