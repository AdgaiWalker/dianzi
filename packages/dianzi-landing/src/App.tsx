import { OpeningAnimation } from './components/OpeningAnimation';

export default function App() {
  return (
    <main>
      <OpeningAnimation />

      <section className="content-band" id="mission">
        <div>
          <p className="section-kicker">DIANZI</p>
          <h2>不是发布灵感，而是让灵感获得下一步。</h2>
        </div>
        <p>
          点子帮助用户用一句话留下模糊想法，再通过 AI 整理、真实需求回应和资源连接，把想法推向可验证的行动。
        </p>
      </section>

      <section className="method-grid" id="method">
        {['写下点子', '整理问题', '获得回应', '形成下一步'].map((item, index) => (
          <article key={item}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{item}</h3>
            <p>
              {index === 0 && '低门槛记录还不成熟的念头，让想法先有一个可靠入口。'}
              {index === 1 && '把方案背后的问题、场景、风险和验证路径逐步说清楚。'}
              {index === 2 && '用试用、建议、资源和协作替代浅层点赞，接近真实行动。'}
              {index === 3 && '沉淀可执行的下一步，让点子从表达进入验证。'}
            </p>
          </article>
        ))}
      </section>

      <section className="preview-strip" id="preview">
        <img src="/materials/dianzi-opening-storyboard.png" alt="DIANZI 开场动画 8 个关键镜头分镜" />
      </section>
    </main>
  );
}
