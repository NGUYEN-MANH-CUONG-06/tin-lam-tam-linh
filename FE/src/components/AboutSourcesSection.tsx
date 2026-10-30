import { ShieldCheck } from "lucide-react";

const SOURCES = [
  {
    label: "Cục Di sản văn hóa · Danh mục di sản văn hóa phi vật thể quốc gia",
    href: "https://dsvh.gov.vn/danh-muc-di-san-van-hoa-phi-vat-the-quoc-gia-1789",
  },
  {
    label: "Hồ Ngọc Đức · Thuật toán lịch âm Việt Nam UTC+7",
  },
  {
    label: "Đài Thiên văn Hong Kong · 24 tiết khí",
    href: "https://www.hko.gov.hk/en/gts/time/24solarterms.htm",
  },
  {
    label: "Âm Lịch VN · Quy tắc 12 sao Hoàng đạo và Hắc đạo",
    href: "https://amlichvn.net/kien-thuc/ngay-hoang-dao-hac-dao/",
  },
  {
    label: "Chinese Temples Committee · Tư liệu thẻ Quan Âm",
    href: "https://www.ctc.org.hk/chim/觀音籤-第一籤/",
  },
  {
    label: "Wikisource · Bản chép Quan Thánh linh xăm (đối chiếu văn bản)",
    href: "https://zh.wikisource.org/w/index.php?title=關聖帝君靈籤&oldid=2428837",
  },
];

export function AboutSourcesSection() {
  return (
    <section
      aria-labelledby="about-tin-lam-title"
      className="about-sources-section mt-12 sm:mt-16"
    >
      <div className="about-sources-heading">
        <span className="about-sources-icon" aria-hidden="true">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="about-sources-eyebrow">Minh bạch tư liệu</p>
          <h2 id="about-tin-lam-title">Về Tin Lắm Tâm Linh</h2>
        </div>
      </div>
      <p className="about-sources-intro">
        Tin Lắm Tâm Linh đối chiếu thông tin văn hóa và lịch với tư liệu phù hợp
        trước khi biên soạn. Nội dung chiêm nghiệm là góc nhìn tham khảo; nguồn
        được ghi theo đúng phần thông tin sử dụng.
      </p>
      <h3 className="about-sources-label">Nguồn tham khảo</h3>
      <ul className="about-sources-list">
        {SOURCES.map((source) => (
          <li key={source.label}>
            {source.href ? (
              <a href={source.href} target="_blank" rel="noreferrer">
                {source.label}
              </a>
            ) : (
              <span>{source.label}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="about-sources-note">
        Mỗi nguồn chỉ áp dụng cho phần nội dung được dẫn. Dị bản và khác biệt
        vùng miền được ghi nhận khi có căn cứ.
      </p>
    </section>
  );
}
