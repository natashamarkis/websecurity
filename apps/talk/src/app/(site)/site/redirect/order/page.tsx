import { demoUser } from '@/entities/demo-user/model'
import { SiteHeader } from '@/widgets/site-header/SiteHeader'
import { SlideTitle } from '@/shared/ui/atoms/SlideTitle'

export default function RedirectOrderPage() {
  return <>
    <SiteHeader userName={demoUser.name} current="redirect" />
    <section className="site-content redirect-result">
      <SlideTitle level={3}>Заказ №48216</SlideTitle>
      <img className="redirect-catalog" src="/presentation/catalog.png" alt="Каталог электротехнической продукции" width={420} height={227} />
      <p>Сборка завершена. Заказ ожидает получения.</p>
      <a href="/site/redirect">Вернуться к письму</a>
    </section>
  </>
}
