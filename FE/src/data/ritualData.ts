import type { ContentMetadata } from "./contentMetadata";
import type { RemoteContentItem } from "./contentService";

export type RitualOccasionKey =
  | "all"
  | "Rằm"
  | "Mùng một"
  | "Tết Nguyên Đán"
  | "Dịp gia đình"
  | "Động thổ";

export type RitualRegionKey =
  | "all"
  | "Bắc Bộ"
  | "Trung Bộ"
  | "Nam Bộ"
  | "Thích ứng đa vùng";

export interface RitualChecklistItem {
  id: string;
  label: string;
  completed?: boolean;
}

export interface RitualOfferingItem {
  id: string;
  name: string;
  subname?: string;
  desc: string;
  isCustomizable?: boolean;
}

export interface RitualStep {
  stepNumber: string;
  title: string;
  desc: string;
}

export interface RitualRegionalDetail {
  region: string;
  desc: string;
}

export interface RitualPrayer {
  id: string;
  preview?: boolean;
  title: string;
  kind: "Văn khấn" | "Văn khấn nôm";
  applicableTo: string;
  paragraphs: string[];
  usageNote?: string;
  metadata: ContentMetadata;
}

export interface RitualDetailContent {
  fullTitle: string;
  subtitle: string;
  heroImage: string;
  heroImageApproved?: boolean;
  heroCaption: string;
  heroArtCredit: string;
  heroSourceUrl?: string;
  heroRightsBasis?: string;
  meaningTitle: string;
  meaningParagraphs: string[];
  meaningQuote: string;
  checklists: RitualChecklistItem[];
  safetyTip: string;
  offeringsTitle?: string;
  offeringAdvice: string;
  offerings: RitualOfferingItem[];
  steps: RitualStep[];
  regionalDetails: RitualRegionalDetail[];
  fireSafetyRules: string[];
  closingQuote: string;
  prayers?: RitualPrayer[];
}

export interface RitualGuideItem {
  id: string;
  preview?: boolean;
  title: string;
  badge?: string;
  badgeType?: "featured" | "occasion" | "family";
  subBadgeOccasion?: string;
  tagOnImage: string;
  stepsCount: string;
  timeEstimate: string;
  desc: string;
  image: string;
  imageApproved?: boolean;
  tagPill: string;
  actionText: string;
  occasion: RitualOccasionKey;
  region: RitualRegionKey;
  detail?: RitualDetailContent;
  metadata?: ContentMetadata;
}

const createPrayerMeta = (sourceTitle: string, author: string, note: string): ContentMetadata => ({
  contentKind: "editorial",
  editorialStatus: "in-review",
  quotationVerified: false,
  usageRights: {
    status: "unknown",
    note: "Chưa xác minh quyền sử dụng; không phát hành như văn khấn đã thẩm định.",
  },
  sources: [
    {
      id: "src-" + sourceTitle.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      title: sourceTitle,
      authorOrOrganization: author,
    },
  ],
  editorialNote: note,
});

export const RITUAL_GUIDES: RitualGuideItem[] = [
  {
    id: "chuan-bi-ngay-ram",
    title: "Chuẩn bị ngày rằm tại nhà",
    badge: "Tiêu điểm",
    badgeType: "featured",
    subBadgeOccasion: "Ngày Rằm (15 Âm lịch)",
    tagOnImage: "Đa vùng thích ứng",
    stepsCount: "4 bước chuẩn bị",
    timeEstimate: "15 - 20 phút",
    desc: "Cách bày biện chén nước thanh tịnh, nén hương mộc và đĩa quả tươi theo nếp sống tinh gọn nơi căn hộ hoặc nhà phố.",
    image: "/images/ritual_ram.jpg",
    tagPill: "TÂM THÀNH THANH TỊNH",
    actionText: "Xem hướng dẫn",
    occasion: "Rằm",
    region: "Thích ứng đa vùng",
    detail: {
      fullTitle: "Chuẩn bị ngày rằm tại nhà: Tinh giản, trang trọng và lắng đọng tâm tư",
      subtitle:
        "Lấy tâm niệm vững chãi, bình tâm làm gốc. Hướng dẫn này giúp bạn chuẩn bị ngày rằm định kỳ, kiêng khem nghi thức phức tạp, chu toàn tình thảo nơi căn hộ tân thời hay nhà phố nhỏ mà không áp lực gánh nặng nghi lễ cồng kềnh.",
      heroImage: "/images/ritual_ram.jpg",
      heroCaption:
        "Góc thờ tự ngày Rằm: Dĩa hoa quả tươi trang thanh khiết, chung nước lọc thanh tịnh và nén hương thơm mộc.",
      heroArtCredit: "Ảnh minh họa trong bản thử nghiệm",
      meaningTitle: "Ý nghĩa của việc dành thời gian tưởng nhớ và giữ nếp nhà",
      meaningParagraphs: [
        "Với một số người, ngày mùng một và ngày rằm là dịp tưởng nhớ tổ tiên hoặc thực hành tín ngưỡng. Bạn có thể tìm hiểu tập tục tại nơi mình sống và chọn cách phù hợp với hoàn cảnh.",
        "Đối với người trẻ, sinh sống nơi đô thị hoặc trong các căn hộ chung cư hiện đại, nghi thức không đòi hỏi mâm cao cỗ đầy hay những thủ tục rườm rà cầu kỳ. Điều cốt tủy nằm ở sự thanh tịnh, sạch sẽ và cái tâm tĩnh lặng. Đó là dịp để làm mới không gian sống, mở toang khung cửa đón gió lành và dành vài phút đứng trước hương án chiêm nghiệm lại chính mình.",
      ],
      meaningQuote:
        "Cây có cội mới trổ cành xanh ngọn, nước có nguồn mới biển rộng sông sâu. Ngày rằm sáng ánh trăng thanh, nén hương tấc dạ chí thành kính dâng.",
      checklists: [
        { id: "c1", label: "Dọn sạch bụi mờ trên mặt bàn thờ" },
        { id: "c2", label: "Thay ly nước sạch (nước tinh khiết mát lành)" },
        { id: "c3", label: "Đĩa quả hoặc cành hoa tươi theo mùa (Tùy nghi)" },
        { id: "c4", label: "1 hoặc 3 nén hương trầm mộc tự nhiên" },
        { id: "c5", label: "Dành 3 - 5 phút tĩnh tâm & hướng tâm an lành" },
      ],
      safetyTip:
        "Tuân thủ quy định của nơi ở về sử dụng lửa và hương. Không che, tháo pin hoặc vô hiệu hóa thiết bị báo khói. Nếu nơi ở không cho phép đốt hương, bạn có thể chọn cách tưởng nhớ không dùng lửa.",
      offeringAdvice:
        "Lời khuyên: “Thực vật theo thời, bày biện tuỳ tâm, quý sạch không quý sang”. Người trẻ không bắt buộc phải đầy đủ mâm cao cỗ đầy nếu không đủ thời gian; sự chỉn chu và tâm niệm hướng thiện là điều quý giá nhất.",
      offerings: [
        {
          id: "o1",
          name: "Chén nước lọc thanh tịnh",
          subname: "(hoặc ấm trà ngụ ý nhã hương đặc)",
          desc: "Tượng trưng cho tâm sáng trong suốt, không vướng bụi trần. Thay nước vào buổi sáng sớm bằng nước sạch tinh khiết.",
        },
        {
          id: "o2",
          name: "Đĩa quả nhỏ sạch theo mùa",
          subname: "(trái cây tươi quê nhà)",
          desc: "Khoảng một vài trái chín mọng theo mùa (chuối chín, táo, ổi, quýt, bưởi...); sạch sẽ và còn nguyên cuống tươi.",
        },
        {
          id: "o3",
          name: "Bình hoa mộc mạc thơm dịu",
          subname: "(sen, cúc, huệ, nhài)",
          desc: "Loài hoa quen thuộc mộc mạc như hoa cúc vàng, hoa sen, hoa huệ tây, hoa nhài... Tránh dùng hoa giả hay hoa quá sặc sỡ mùi nồng gắt.",
        },
        {
          id: "o4",
          name: "Nén hương thơm tự nhiên",
          subname: "(Hương trầm sạch / Hương tăm mộc)",
          desc: "Nếu nơi ở cho phép dùng hương, làm theo hướng dẫn an toàn và giữ phòng thông thoáng. Bạn có thể không dùng hương.",
        },
        {
          id: "o5",
          name: "Đèn dầu chuyên dụng sạch sẽ",
          subname: "(Đèn gốm sứ / Đèn dầu thực vật)",
          desc: "Nếu dùng nến thơm hoặc đèn dầu, để nơi vững chãi, cách xa vật liệu dễ cháy; nên thổi tắt khi không có người ở nhà.",
        },
      ],
      steps: [
        {
          stepNumber: "01",
          title: "Chuẩn bị không gian & Thân tâm an định",
          desc: "Mở rộng then cửa sổ hoặc kéo rèm để đón gió tươi buổi sớm và ánh sáng tự nhiên vào căn nhà. Rửa sạch đôi tay bằng nước ấm, chỉnh trang y phục gọn gàng, sạch sẽ và trang nhã. Tạm thời tắt thông báo điện thoại từ 15-20 phút, giữ cho một bầu không khí mang lại cảm giác bình thản mộc mạc trước khi bước vào sửa soạn.",
        },
        {
          stepNumber: "02",
          title: "Sắp xếp vật phẩm trang trọng, tinh tươm",
          desc: "Dùng khăn sạch lau nhẹ bụi mờ trên bàn thờ/kệ thờ. Thay nước mới vào chén lưu ly, sắp đĩa hoa quả ngay ngắn chính giữa; bình hoa đặt gọn phía tay trái (tả hữu tương hợp) nếu có không gian. Mọi thao tác chậm rãi, trân trọng như đang nâng niu bình an của chính mình.",
        },
        {
          stepNumber: "03",
          title: "Dành thời gian tưởng niệm tĩnh lặng",
          desc: "Thắp một nén hương (hoặc nụ trầm) cắm thẳng thắn vào bát hương; hướng ánh nhìn trang nghiêm, mắt mở hé nhìn vào ngọn trầm cháy. Giữ tư thế ngay ngắn, hai bàn tay chắp nhẹ trước ngực, thả lỏng trán và vai; dành từ 3 đến 5 phút hướng tâm niệm thiện lành tới ông bà tổ tiên hoặc vạn vật tốt đẹp quanh mình. Không cầu xin tiền tài hay phép màu, chỉ xin được lòng an tịnh và sự thấu suốt trước sóng gió cuộc đời.",
        },
        {
          stepNumber: "04",
          title: "Thu dọn an toàn & Thưởng thức lộc lành",
          desc: "Nếu có đốt hương, kiểm tra lửa đã tắt hẳn trước khi rời đi. Việc sử dụng đồ lễ sau đó tùy theo tập tục và nhu cầu của bạn.",
        },
      ],
      regionalDetails: [
        {
          region: "Bắc Bộ",
          desc: "Chú trọng nếp trang nghiêm, chén nước chè tươi thơm ngát hoặc nước trong, đĩa trầu cau têm cánh phượng và nụ hoa ngâu/hoa cúc vàng tươi thắm.",
        },
        {
          region: "Trung Bộ",
          desc: "Chắt chiu dung dị, thường chuộng nén trầm xứ Quảng thơm đượm, mâm ngũ quả thanh đạm theo mùa, nếp cúng hiếu đễ thâm trầm hướng cội nguồn sâu lắng.",
        },
        {
          region: "Nam Bộ",
          desc: "Phóng khoáng, tự nhiên; nải chuối sứ vàng ươm, trái mãng cầu, dừa tươi, đu đủ và xoài (ngụ ý “cầu vừa đủ xài”); chuộng nhang thơm nhẹ nhàng lan tỏa.",
        },
      ],
      fireSafetyRules: [
        "Chỉ thắp một nén hương mộc ngắn hoặc nụ trầm trên đĩa gốm; không cắm que hương cháy dở vào chân tường hay gần rèm cửa.",
        "Tuyệt đối không dùng nến thơm có bấc quá dài cạnh đồ gỗ; đặt nến trong cốc thủy tinh hoặc đĩa gốm sứ cách nhiệt vững chãi.",
        "Trước khi đi làm hoặc đi ngủ, luôn kiểm tra tắt tàn hương/nến. Không thắp hương quá muộn sau 21h nếu không có người canh chừng.",
      ],
      closingQuote:
        "Lễ bạc tâm thanh, cốt tại lòng thành; khói trầm quyện tỏa, phúc lộc tự sinh.",
      prayers: [
        {
          id: "prayer-ram-than-linh",
          title: "Văn khấn Thổ Công & Chư vị Thần Linh ngày Rằm (ngày Vọng)",
          kind: "Văn khấn nôm",
          applicableTo: "Bàn thờ Thổ Công, Táo Quân và Chư vị Thần Linh tại gia",
          paragraphs: [
            "Nam mô A Di Đà Phật! (3 lần, 3 lạy)",
            "Con kính lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.",
            "Con kính lạy Hoàng thiên Hậu thổ chư vị Tôn thần.",
            "Con kính lạy ngài Đông trù Tư mệnh Táo phủ Thần quân.",
            "Con kính lạy ngài Bản gia Thổ địa Long Mạch Tôn thần, cùng chư vị Tôn thần cai quản bản xứ.",
            "Tín chủ con là: ... cùng toàn thể gia quyến cư ngụ tại: ...",
            "Hôm nay là ngày Rằm (ngày Vọng) tháng ..., gặp tiết sóc vọng trăng tròn viên mãn, tín chủ con thành tâm sắm sửa hương hoa trà quả, phẩm vật thanh khiết, kính cẩn dâng lên trước án.",
            "Chúng con kính mời ngài Kim niên Đương cai Thái Tuế, ngài Bản cảnh Thành hoàng, ngài Đông trù Tư mệnh Táo phủ Thần quân, ngài Bản gia Thổ địa Long Mạch Tôn thần cùng chư vị Tôn thần giáng lâm trước án, chứng giám lòng thành, thụ hưởng lễ vật.",
            "Nguyện xin chư vị Thần linh chở che, ban ơn cho gia quyến chúng con muôn sự bình an, bốn mùa không hạn ách, tám tiết hưởng thái bình, gia đạo thuận hòa, tâm sáng chí bền.",
            "Dãi tấm lòng thành, cúi xin chứng giám. Cẩn cáo!"
          ],
          usageNote: "Đọc trước bàn thờ Thần Linh / Thổ Công với tâm thái kính cẩn, trang phục chỉnh tề.",
          metadata: createPrayerMeta(
            "Văn Khấn Cổ Truyền Việt Nam",
            "NXB Văn Hóa Thông Tin",
            "Văn bản chuẩn mực theo cổ lệ ngày Sóc Vọng, biên tập tinh gọn phù hợp gia đình hiện đại."
          ),
        },
        {
          id: "prayer-ram-gia-tien",
          title: "Văn khấn Gia Tiên ngày Rằm (ngày Vọng)",
          kind: "Văn khấn nôm",
          applicableTo: "Bàn thờ Gia Tiên, Tiền Tổ nội ngoại",
          paragraphs: [
            "Nam mô A Di Đà Phật! (3 lần, 3 lạy)",
            "Kính lạy Tổ tiên nội ngoại dòng họ ..., cùng chư vị Hương linh khuất mặt tiền hiền hậu tổ.",
            "Hôm nay là ngày Rằm tháng ..., trăng tròn viên mãn.",
            "Con cháu chúng con là: ..., cùng toàn thể gia quyến, cúi đầu kính cẩn trước hương án.",
            "Nhớ ơn đức sinh thành dưỡng dục sâu dày của tiên tổ, chúng con sắm sửa chén nước trong, nén hương mộc và đĩa quả ngọt dâng lên án tiền.",
            "Kính cẩn mời các bậc cao tằng tổ khảo, cao tằng tổ tỷ, bá thúc huynh đệ, cô di tỷ muội nội ngoại giáng lâm trước hương án, chứng giám tấc lòng thành, thụ hưởng lễ vật.",
            "Cúi xin tiên tổ chở che, dẫn lối cho cháu con sống thuận hòa yêu thương, giữ gìn gia phong nếp nhà, công việc hanh thông, tai qua nạn khỏi.",
            "Chúng con lễ bạc tâm thành, trước án kính lễ, cúi xin phù hộ độ trì. Cẩn cáo!"
          ],
          usageNote: "Đọc sau khi đã khấn xong bài Thần Linh, hoặc đọc chung nếu bàn thờ đặt phối tự.",
          metadata: createPrayerMeta(
            "Nếp Cũ: Phong Tục Thờ Cúng Tổ Tiên",
            "Toan Ánh",
            "Khảo cứu văn khấn gia tiên nếp nhà truyền thống thuần hậu của người Việt."
          ),
        },
      ],
    },
  },
  {
    id: "mung-mot-thanh-tinh",
    title: "Nghi thức mùng một thanh tịnh",
    badge: "Mùng Một (Đầu tháng)",
    badgeType: "occasion",
    tagOnImage: "Bắc Bộ & Trung Bộ",
    stepsCount: "4 bước giản dị",
    timeEstimate: "10 - 15 phút",
    desc: "Khởi đầu tháng mới với tâm thế an hòa, dọn gọn không gian thờ tự và thắp nén trầm an trú.",
    image: "/images/tea_bowl.jpg",
    tagPill: "TỰ TẠI THÂN TÂM",
    actionText: "Xem hướng dẫn",
    occasion: "Mùng một",
    region: "Bắc Bộ",
    detail: {
      fullTitle: "Nghi thức mùng một đầu tháng: Khởi tâm an định & Đón sinh khí mới",
      subtitle:
        "Mùng một sớm mai mang ý nghĩa khởi đầu. Bằng những việc làm nhỏ giản dị: dọn dẹp hương án, dâng chén nước tinh khiết và nén trầm thơm, hướng tâm tới sự thuận hòa, tươi mới cho cả tháng.",
      heroImage: "/images/tea_bowl.jpg",
      heroCaption: "Tĩnh lặng sớm mùng một: Chén trà thơm ấm và nén trầm thanh khiết.",
      heroArtCredit: "Ảnh minh họa trong bản thử nghiệm",
      meaningTitle: "Ý nghĩa của ngày sóc (mùng một) trong nếp sống",
      meaningParagraphs: [
        "Ngày mùng một âm lịch (ngày Sóc) đánh dấu chu kỳ tuần hoàn mới của vầng trăng và vạn vật. Trong truyền thống người Việt, đây là thời khắc chuyển hóa năng lượng, là dịp để mỗi người dọn sạch những muộn phiền tháng cũ và mở lòng đón nhận những điều lành tháng mới.",
        "Nghi thức mùng một không nhằm cầu xin tài lộc tức thời, mà là một khoảng lặng thiêng liêng để ta nhắc nhở chính mình sống chánh niệm, nói lời hòa ái và nuôi dưỡng tâm từ bi trong từng hành động hàng ngày.",
      ],
      meaningQuote:
        "Sớm mai mùng một khai hoa, mở lòng đón phúc vào nhà an khang.",
      checklists: [
        { id: "mm-1", label: "Quét dọn gian phòng và bàn thờ sạch sẽ, trang nghiêm" },
        { id: "mm-2", label: "Rửa sạch chén thờ, thay nước trong hoặc pha ấm trà ấm mới" },
        { id: "mm-3", label: "Dâng đĩa hoa tươi (hoa cúc, hoa huệ hoặc hoa sen)" },
        { id: "mm-4", label: "Thắp 1 nén hương mộc tự nhiên hoặc nụ trầm trên đĩa gốm" },
        { id: "mm-5", label: "Dành 3 phút tĩnh tâm, gửi lời chúc an lành tới gia đình và muôn người" },
      ],
      safetyTip: "Nên thắp hương vào buổi sáng sớm khi nhà cửa thông thoáng; chỉ thắp 1 nén để không gian trong lành.",
      offeringAdvice: "Ưu tiên lễ vật thanh đạm: chén nước suối trong, đĩa quả mùa tươi ngon, ấm trà mộc.",
      offerings: [
        {
          id: "mm-off-1",
          name: "Chén nước trong thanh tịnh",
          subname: "Thủy tinh khiết",
          desc: "Tượng trưng cho tâm sáng không vướng bụi trần, soi tỏ lòng thành và sự an định.",
        },
        {
          id: "mm-off-2",
          name: "Đĩa hoa tươi thơm ngát",
          subname: "Hoa cúc / Hoa sen / Hoa ngâu",
          desc: "Hương hoa tự nhiên biểu hiện của lòng tôn kính và sự tươi mới của sự sống.",
        },
        {
          id: "mm-off-3",
          name: "Nén hương mộc hoặc nụ trầm",
          subname: "Trầm hương tự nhiên",
          desc: "Khói thơm lan tỏa kết nối tâm thức hiện tại với nguồn cội bình yên.",
        },
      ],
      steps: [
        {
          stepNumber: "01",
          title: "Đón nắng sớm & Tĩnh lặng thân tâm",
          desc: "Mở cửa đón gió sớm, rửa sạch đôi bàn tay và gương mặt. Giữ cho tâm trạng nhẹ nhõm, không vội vã.",
        },
        {
          stepNumber: "02",
          title: "Sắp đặt hoa nước trang nghiêm",
          desc: "Lau nhẹ bàn thờ, dâng chén nước sạch và đĩa hoa quả thơm tho ngay ngắn trước ban thờ.",
        },
        {
          stepNumber: "03",
          title: "Thắp nén tâm hương đầu tháng",
          desc: "Thắp một nén hương mộc, chắp tay ngay ngắn, hướng tâm niệm thiện lành và bao dung cho cả tháng mới.",
        },
        {
          stepNumber: "04",
          title: "Khởi đầu ngày mới trong an hòa",
          desc: "Uống một ngụm trà ấm trong chánh niệm, mỉm cười với người thân và bắt đầu công việc với niềm vui.",
        },
      ],
      regionalDetails: [
        {
          region: "Bắc Bộ",
          desc: "Thường dâng ấm trà sen hoặc trà lài thơm ngát, đĩa trầu cau têm cánh phượng và nụ cúc vàng tinh khôi.",
        },
        {
          region: "Trung Bộ",
          desc: "Đốt nén trầm xứ Quảng đượm hương, dâng hoa cúc vàng hoặc hoa sen Huế trang nhã và thâm trầm.",
        },
        {
          region: "Nam Bộ",
          desc: "Đĩa hoa huệ trắng thơm lừng, trái dừa tươi mát lành và nén nhang nhẹ nhàng lan tỏa sinh khí.",
        },
      ],
      fireSafetyRules: [
        "Chỉ thắp 1 nén hương mộc ngắn hoặc nụ trầm trên đĩa gốm cách nhiệt an toàn.",
        "Không thắp hương sát rèm cửa, giấy thờ hay các vật liệu dễ bắt lửa.",
        "Đảm bảo tàn nhang đã nguội hoàn toàn trước khi rời khỏi nhà đi làm.",
      ],
      closingQuote:
        "Tâm bình vạn sự bình, tâm an vạn sự an. Sớm sóc một nén tâm hương, trọn tháng thảnh thơi cát tường.",
      prayers: [
        {
          id: "prayer-mung-mot-than-linh",
          title: "Văn khấn Thổ Công & Chư vị Thần Linh ngày Mùng Một (ngày Sóc)",
          kind: "Văn khấn nôm",
          applicableTo: "Bàn thờ Thần Linh, Thổ Công, Táo Quân khởi đầu tháng mới",
          paragraphs: [
            "Nam mô A Di Đà Phật! (3 lần, 3 lạy)",
            "Con kính lạy chín phương Trời, mười phương Chư Phật.",
            "Con kính lạy Hoàng thiên, Hậu thổ chư vị Tôn thần.",
            "Con kính lạy ngài Đông trù Tư mệnh Táo phủ Thần quân, Bản gia Thổ địa Long Mạch Tôn thần cai quản bản xứ.",
            "Tín chủ con là: ..., cùng toàn gia cư ngụ tại: ...",
            "Hôm nay là ngày Mùng Một (ngày Sóc) tháng ..., gặp tiết đầu tháng mới khởi sắc.",
            "Tín chủ con lòng thành dâng nén hương thơm, chén nước thanh khiết, hoa tươi quả tốt dâng lên trước án, kính cẩn tạ ơn đất trời che chở và xin kính cáo đầu tháng mới.",
            "Cầu xin chư vị Tôn thần phù hộ cho bản gia tháng mới sinh khí tươi nhuận, sở cầu như ý, sở nguyện tòng tâm, gia môn đầm ấm, công việc hanh thông, thân tâm thường an lạc.",
            "Dãi tấm lòng thành, cúi xin chứng giám. Cẩn cáo!"
          ],
          usageNote: "Nên khấn vào buổi sáng sớm ngày Mùng Một để đón nhận sinh khí tươi mới.",
          metadata: createPrayerMeta(
            "Văn Khấn Cổ Truyền Việt Nam",
            "NXB Văn Hóa Thông Tin",
            "Văn khấn Nôm ngày Sóc truyền thống, chú trọng khởi tâm thiện lành và bình an."
          ),
        },
        {
          id: "prayer-mung-mot-gia-tien",
          title: "Văn khấn Gia Tiên ngày Mùng Một đầu tháng",
          kind: "Văn khấn nôm",
          applicableTo: "Bàn thờ Tiên Tổ nội ngoại ngày Mùng Một",
          paragraphs: [
            "Nam mô A Di Đà Phật! (3 lần, 3 lạy)",
            "Kính lạy Tổ tiên nội ngoại chư vị Hương linh dòng họ ...",
            "Hôm nay ngày Mùng Một tháng ... âm lịch, tiết đầu tháng mới.",
            "Con cháu chúng con cúi đầu trước hương án trang nghiêm, thành tâm dâng nén tâm hương tưởng niệm và hoa trái ngọt lành.",
            "Kính mời chân linh tổ tiên giáng phó sàng tiền chứng giám lòng thảo, thụ hưởng lễ vật.",
            "Cúi xin tiên tổ chở che độ trì cho con cháu một tháng mới được bình an, mạnh khỏe, thuận hòa đùm bọc, việc lành mang đến, việc dữ xua đi.",
            "Lễ bạc tâm thành, cúi xin chứng giám. Cẩn cáo!"
          ],
          usageNote: "Khấn sau khi dâng hương Thần Linh, bày tỏ lòng hiếu kính tổ tiên.",
          metadata: createPrayerMeta(
            "Nếp Cũ: Phong Tục Thờ Cúng Tổ Tiên",
            "Toan Ánh",
            "Bài khấn nếp nhà xưa lưu truyền đạo hiếu và nếp sống thuần phong mỹ tục."
          ),
        },
      ],
    },
  },
  {
    id: "tuong-nho-gia-dinh",
    title: "Không gian tưởng nhớ gia đình",
    badge: "Dịp gia đình • Tưởng nhớ",
    badgeType: "family",
    tagOnImage: "Truyền thống chung",
    stepsCount: "4 bước ý niệm",
    timeEstimate: "30 phút",
    desc: "Gợi ý sắp đặt góc kỷ niệm tổ tiên ấm cúng, chuẩn bị mâm cơm gia đình sum vầy mà không áp lực lễ nghi rườm rà.",
    image: "/images/ancestor_portrait.jpg",
    tagPill: "GẮN KẾT CỘI NGUỒN",
    actionText: "Xem hướng dẫn",
    occasion: "Dịp gia đình",
    region: "Thích ứng đa vùng",
    detail: {
      fullTitle: "Không gian tưởng nhớ gia đình: Gắn kết cội nguồn & Nuôi dưỡng ân tình",
      subtitle:
        "Bàn thờ gia tiên là trái tim của ngôi nhà Việt. Bằng sự chu toàn mộc mạc, hướng dẫn này gợi ý cách chăm chút góc kỷ niệm tổ tiên ấm áp, nơi con cháu cùng hướng về công đức cội nguồn.",
      heroImage: "/images/ancestor_portrait.jpg",
      heroCaption: "Góc thờ gia tiên ấm cúng: Nơi lưu giữ ký ức và tình thương của bao thế hệ.",
      heroArtCredit: "Ảnh minh họa trong bản thử nghiệm",
      meaningTitle: "Uống nước nhớ nguồn — Gốc rễ của đạo làm người",
      meaningParagraphs: [
        "Tập tục thờ phụng tổ tiên của người Việt không phải là sự kính sợ thần linh trừu tượng, mà là sự tiếp nối tình cảm hiếu đễ đối với những người đã sinh thành và dưỡng dục mình. Ngay cả trong nhịp sống chung cư bận rộn, một góc tưởng niệm nhỏ xinh cũng đủ làm ấm lòng người đi xa trở về.",
        "Mỗi dịp giỗ chạp hay kỷ niệm, việc sum vầy bên mâm cơm gia đình chính là sợi dây vô hình kết nối các thế hệ, nhắc nhở con cháu về nếp nhà và cội nguồn yêu thương.",
      ],
      meaningQuote:
        "Con người có tổ có tông, như cây có cội như sông có nguồn. Ơn sâu nghĩa nặng muôn đời khắc ghi.",
      checklists: [
        { id: "tn-1", label: "Dùng khăn mềm sạch lau bụi quanh khung ảnh và kỷ vật gia tiên" },
        { id: "tn-2", label: "Chuẩn bị mâm cơm gia đình ấm cúng với những món người xưa yêu thích" },
        { id: "tn-3", label: "Dâng đĩa hoa tươi thanh nhã và chén nước trong" },
        { id: "tn-4", label: "Thắp nén hương tưởng nhớ, mời gia tiên về chứng tri lòng thảo" },
        { id: "tn-5", label: "Cả nhà cùng quây quần dùng bữa, chia sẻ kỷ niệm và bài học của người đi trước" },
      ],
      safetyTip: "Nếu bàn thờ đặt trên kệ treo tường chung cư, chú ý khoảng cách trần để khói hương không làm ố trần nhà.",
      offeringAdvice: "Mâm cơm cúng gia đình chuộng sự ấm cúng, món ăn nấu nướng vừa đủ, tránh lãng phí thực phẩm.",
      offerings: [
        {
          id: "tn-off-1",
          name: "Mâm cơm gia đình sum vầy",
          subname: "Các món ăn nếp nhà",
          desc: "Những món ăn thân thuộc gợi nhớ hương vị bàn tay mẹ nấu ngày xưa, chan chứa tình thảo.",
        },
        {
          id: "tn-off-2",
          name: "Trái cây theo mùa",
          subname: "Hoa thơm quả ngọt",
          desc: "Lòng thành dâng những thức quả tươi sạch theo mùa tỏ lòng biết ơn trời đất và tiền nhân.",
        },
      ],
      steps: [
        {
          stepNumber: "01",
          title: "Chăm chút góc tưởng niệm",
          desc: "Lau dọn khung ảnh, bát hương gọn gàng; bày biện hoa tươi và chén nước trong tĩnh tươm.",
        },
        {
          stepNumber: "02",
          title: "Chuẩn bị mâm cơm thảo thơm",
          desc: "Nấu mâm cơm ấm cúng với sự chung tay của các thành viên trong gia đình.",
        },
        {
          stepNumber: "03",
          title: "Phút giây tưởng niệm tĩnh lặng",
          desc: "Thắp nén hương thơm, dành vài phút lặng im nhớ về công lao, lời dạy và nụ cười của tiền nhân.",
        },
        {
          stepNumber: "04",
          title: "Bữa cơm gắn kết yêu thương",
          desc: "Cùng người thân quây quần thưởng thức bữa cơm, kể cho con trẻ nghe chuyện cội nguồn xưa.",
        },
      ],
      regionalDetails: [
        { region: "Bắc Bộ", desc: "Mâm cơm truyền thống với đĩa gà luộc, đĩa xôi gấc đỏ tươi, canh măng miến ấm nồng." },
        { region: "Trung Bộ", desc: "Đậm đà tình thảo với đĩa thịt luộc tôm chua, canh cá đồng và bánh tét đậm vị quê hương." },
        { region: "Nam Bộ", desc: "Thảo thơm hào sảng với nồi thịt kho hột vịt, tô canh khổ qua nhồi thịt và dĩa dưa giá giòn ngọt." },
      ],
      fireSafetyRules: [
        "Sử dụng tấm chống ám khói hoặc gắn kính cách nhiệt phía trên trần bàn thờ.",
        "Tắt hết nến và kiểm tra hương tàn trước khi rời khỏi khu vực ăn uống.",
      ],
      closingQuote:
        "Sợi dây gia đình là mạch nguồn ấm áp nhất; thắp nén hương thơm để tình thương và nếp nhà còn mãi theo thời gian.",
      prayers: [
        {
          id: "prayer-tuong-nho-gia-tien",
          title: "Văn khấn Tri ân Tiên Tổ & Gắn kết Gia quyến",
          kind: "Văn khấn nôm",
          applicableTo: "Dịp sum họp gia đình, kỷ niệm người thân hoặc ngày họp mặt họ hàng",
          paragraphs: [
            "Nam mô A Di Đà Phật! (3 lần, 3 lạy)",
            "Kính lạy Cửu Huyền Thất Tổ nội ngoại chư vị Hương linh dòng họ ...",
            "Kính lạy vong linh ông bà, cha mẹ, cô di tỷ muội, bá thúc huynh đệ qua các đời.",
            "Hôm nay là ngày lành tháng tốt, gia đình chúng con tề tựu bên mái ấm thân yêu, trước hương án trang nghiêm.",
            "Chúng con xin dâng nén hương mộc thanh khiết, chén nước trong và mâm cơm nếp nhà giản dị, bày tỏ tấm lòng tri ân sâu nặng với công đức sinh thành, dưỡng dục, vun đắp cơ nghiệp của các bậc tiền nhân.",
            "Cúi xin chư vị giáng phó sàng tiền, chứng giám lòng thành thơm thảo, thụ hưởng lễ vật.",
            "Cầu xin tổ tiên phù hộ độ trì cho đại gia đình chúng con trên thuận dưới hòa, trong ấm ngoài êm, con cháu chăm ngoan học giỏi, biết yêu thương đùm bọc lẫn nhau, kế thừa xứng đáng nếp gia phong hiền đức của dòng họ.",
            "Dãi tấm lòng thành, cúi xin chứng giám. Cẩn cáo!"
          ],
          usageNote: "Chỉ đọc nếu phù hợp với tập tục và hoàn cảnh của bạn.",
          metadata: createPrayerMeta(
            "Nếp Cũ: Gia Tộc và Phong Tục Dân Gian",
            "Toan Ánh",
            "Khảo cứu về đạo hiếu và các nghi thức tri ân tiên tổ trong gia đình người Việt."
          ),
        },
      ],
    },
  },
  {
    id: "phong-tuc-dau-nam",
    title: "Tìm hiểu phong tục đầu năm",
    badge: "Tết Nguyên Đán",
    badgeType: "occasion",
    tagOnImage: "Bắc - Trung - Nam",
    stepsCount: "4 giai đoạn",
    timeEstimate: "Mùa lễ hội",
    desc: "Giải mã ý nghĩa tục tiễn ông Táo, dọn nhà đón Tết và nghi thức giao thừa hướng tới ước nguyện an khang, hòa thuận.",
    image: "/images/hero_family.jpg",
    tagPill: "KHỞI SẮC TÂN NIÊN",
    actionText: "Xem hướng dẫn",
    occasion: "Tết Nguyên Đán",
    region: "Thích ứng đa vùng",
    detail: {
      fullTitle: "Phong tục Tết Nguyên Đán: Tiễn Táo Quân, Đón Giao Thừa & Khởi Sắc Tân Niên",
      subtitle:
        "Tết Nguyên Đán là điểm chạm linh thiêng nhất trong dòng chảy văn hóa Việt. Từ ngày 23 tháng Chạp đến đêm trừ tịch, mỗi nếp tục đều hướng tới sự đoàn viên, xóa bỏ hiềm khích và đón chào vận hội mới.",
      heroImage: "/images/hero_family.jpg",
      heroCaption: "Sum vầy ngày Tết: Nồi bánh chưng xanh, cành đào thắm và nụ cười rạng rỡ của cả gia đình.",
      heroArtCredit: "Ảnh minh họa trong bản thử nghiệm",
      meaningTitle: "Tết là sự trở về và khởi sinh của tình thân",
      meaningParagraphs: [
        "Tết không chỉ là thời điểm chuyển giao giữa năm cũ và năm mới, mà là dịp tống cựu nghinh tân: dọn sạch những bụi bặm âu lo của năm cũ để mở lòng đón nhận vạn sự hanh thông. Từ mâm cơm cúng Táo quân giản dị đến mâm ngũ quả ngày Tết, tất cả đều gửi gắm ước nguyện về một mái ấm no đủ, thuận hòa.",
        "Trong không gian đô thị ngày nay, việc giữ gìn nghi thức Tết tinh gọn, không rườm rà giúp gia đình có thêm thời gian thực sự thảnh thơi trò chuyện, gắn kết bên nhau.",
      ],
      meaningQuote:
        "Đào mai khoe sắc đón tân niên, sum vầy ấm cúng nối nhân duyên. Tống cựu nghinh tân lòng thanh thản, xuân sang rạng rỡ phúc triền miên.",
      checklists: [
        { id: "tet-1", label: "Dọn dẹp trang hoàng nhà cửa, quét dọn bàn thờ đón Tết" },
        { id: "tet-2", label: "Chuẩn bị mâm lễ tiễn ông Táo chầu trời (23 tháng Chạp)" },
        { id: "tet-3", label: "Bày biện mâm ngũ quả và cành hoa đào / hoa mai tươi thắm" },
        { id: "tet-4", label: "Nghi thức cúng Tất niên chiều 30 Tết và cúng Giao Thừa lúc nửa đêm" },
        { id: "tet-5", label: "Mừng tuổi ông bà cha mẹ, chúc nhau một năm mới an khang thịnh vượng" },
      ],
      safetyTip: "Đêm Giao Thừa không đốt vàng mã nhiều; chỉ thắp 1 nén hương thơm để bảo vệ không khí trong lành.",
      offeringAdvice: "Mâm ngũ quả lựa chọn quả tươi ngon, màu sắc hài hòa theo ngũ hành (Kim - Mộc - Thủy - Hỏa - Thổ).",
      offerings: [
        {
          id: "tet-off-1",
          name: "Mâm ngũ quả ngày Tết",
          subname: "Ngũ phúc lâm môn",
          desc: "Đại diện cho năm ước nguyện lớn: Phú, Quý, Thọ, Khang, Ninh.",
        },
        {
          id: "tet-off-2",
          name: "Bánh chưng / Bánh tét",
          subname: "Hồn cốt ẩm thực Tết",
          desc: "Tượng trưng cho Đất - Trời và sự đùm bọc yêu thương của gia đình người Việt.",
        },
      ],
      steps: [
        {
          stepNumber: "01",
          title: "Tống cựu nghinh tân (Dọn nhà đón Tết)",
          desc: "Cả nhà cùng nhau lau dọn, sửa sang nhà cửa và sắp đặt lại không gian sống tươi tắn.",
        },
        {
          stepNumber: "02",
          title: "Bày biện mâm ngũ quả & hoa xuân",
          desc: "Đặt mâm ngũ quả chính giữa bàn thờ, bình hoa tươi bên tả, tạo sinh khí rực rỡ đón xuân.",
        },
        {
          stepNumber: "03",
          title: "Khoảnh khắc Giao Thừa thiêng liêng",
          desc: "Đúng thời khắc chuyển giao, thắp nén hương thơm, hướng tâm niệm bình an cho quê hương, gia đình.",
        },
        {
          stepNumber: "04",
          title: "Khởi sắc đầu xuân",
          desc: "Mở rộng cửa đón gió xuân, trao nhau những lời chúc mừng đầu năm ấm áp chân thành.",
        },
      ],
      regionalDetails: [
        { region: "Bắc Bộ", desc: "Cành đào phai/đào bích thắm, mâm ngũ quả chuối xanh bưởi vàng, nồi bánh chưng vuông vức." },
        { region: "Trung Bộ", desc: "Bánh tét truyền thống, dưa món đậm đà, cành mai vàng rực rỡ và nếp chúc tụng hiếu đễ sâu sắc." },
        { region: "Nam Bộ", desc: "Mâm ngũ quả 'Cầu - Dừa - Đủ - Xoài', cành mai vàng óng ả, nồi thịt kho trứng ấm tình phương Nam." },
      ],
      fireSafetyRules: [
        "Tuyệt đối không đốt vàng mã tại hành lang, ban công hay gần lối thoát hiểm chung cư.",
        "Cắm hương chắc chắn vào bát hương, tránh để chân hương quá dày gây bốc hỏa.",
      ],
      closingQuote:
        "Khởi sắc đầu xuân bằng sự hòa thuận và lòng biết ơn; nếp nhà ấm êm là cội nguồn của vạn điều may mắn.",
      prayers: [
        {
          id: "prayer-giao-thua-trong-nha",
          title: "Văn khấn Giao Thừa trong nhà (Lễ Trừ Tịch)",
          kind: "Văn khấn nôm",
          applicableTo: "Thời khắc giao thừa nửa đêm 30 rạng sáng mùng 1 Tết",
          paragraphs: [
            "Nam mô A Di Đà Phật! (3 lần, 3 lạy)",
            "Con kính lạy chín phương Trời, mười phương Chư Phật.",
            "Con kính lạy Đức Đương lai hạ sinh Di Lặc Tôn Phật.",
            "Con kính lạy Quan Đương niên Hành khiển, Quan Đương cảnh Thành hoàng, ngài Bản xứ Thần linh Thổ địa, ngài Định phúc Táo quân cai quản bản gia.",
            "Con kính lạy Tiên tổ nội ngoại chư vị Hương linh.",
            "Nay phút giao thừa thiêng liêng năm cũ ... bước sang năm mới ..., trời đất giao hòa, vạn vật chuyển mùa tươi sáng.",
            "Tín chủ con thành tâm sắm sửa hương hoa trà quả, kim ngân phẩm vật, kính cẩn dâng lên trước hương án, tạ ơn trời đất thần linh và tổ tiên đã che chở độ trì cho gia đình một năm qua bình an vô sự.",
            "Cúi xin các ngài giáng lâm trước án, thụ hưởng lễ vật, trừ bỏ vận xui năm cũ, ban phát phúc lành năm mới; độ cho mưa thuận gió hòa, quốc thái dân an, gia đạo an khang thịnh vượng, trong ấm ngoài êm, bốn mùa hưởng thái bình cát khánh.",
            "Dãi tấm lòng thành, cúi xin chứng giám. Cẩn cáo!"
          ],
          usageNote: "Đọc vào đúng thời khắc giao thừa 0h00 đêm cuối năm, sau khi đã thắp hương.",
          metadata: createPrayerMeta(
            "Văn Khấn Cổ Truyền Việt Nam",
            "NXB Văn Hóa Thông Tin",
            "Văn bản chuẩn lễ Trừ tịch trong nhà, tống cựu nghinh tân."
          ),
        },
        {
          id: "prayer-mung-mot-tet",
          title: "Văn khấn Mùng Một Tết Nguyên Đán",
          kind: "Văn khấn nôm",
          applicableTo: "Sáng sớm Mùng Một Tết Nguyên Đán",
          paragraphs: [
            "Nam mô A Di Đà Phật! (3 lần, 3 lạy)",
            "Kính lạy Tổ tiên nội ngoại chư vị Hương linh.",
            "Sớm mai mùng Một đầu xuân năm mới ..., trời đất bừng sáng khí xuân rực rỡ.",
            "Con cháu chúng con kính cẩn dâng mâm cỗ xuân đầu năm, bánh chưng xanh mâm ngũ quả, dâng nén tâm hương kính mời tiên tổ về vui xuân cùng cháu con.",
            "Kính xin tổ tiên chứng giám lòng hiếu kính, phù hộ cho gia đình năm mới vạn sự hanh thông, phúc thọ tăng long, gia hòa vạn sự hưng.",
            "Cẩn cáo!"
          ],
          usageNote: "Đọc vào sáng sớm mùng Một Tết trước khi các thành viên mừng tuổi đầu năm.",
          metadata: createPrayerMeta(
            "Phong Tục Tết Cổ Truyền",
            "NXB Dân Trí",
            "Nghi thức cúng dâng mâm cỗ tết đầu năm đón xuân."
          ),
        },
      ],
    },
  },
  {
    id: "cung-gio-mien-nam",
    title: "Tập tục cúng giỗ truyền thống miền Nam",
    badge: "Dịp gia đình",
    badgeType: "family",
    tagOnImage: "Nam Bộ đặc trưng",
    stepsCount: "4 bước nếp nhà",
    timeEstimate: "Nửa ngày",
    desc: "Nét thảo thơm phóng khoáng của mâm cơm giỗ phương Nam: canh khổ qua, thịt kho rệu và tấm lòng thảo hiếu đãi đằng chòm xóm.",
    image: "/images/mekong_nam_bo.jpg",
    tagPill: "TÌNH LÀNG NGHĨA XÓM",
    actionText: "Xem hướng dẫn",
    occasion: "Dịp gia đình",
    region: "Nam Bộ",
    detail: {
      fullTitle: "Tập tục cúng giỗ phương Nam: Thảo thơm nếp nhà & Đượm tình chòm xóm",
      subtitle:
        "Cúng giỗ ở Nam Bộ mang phong vị phóng khoáng, nghĩa tình. Đó không chỉ là ngày nhớ ơn người đã khuất, mà còn là ngày sum họp của đại gia đình và thắt chặt tình nghĩa xóm giềng đầm ấm.",
      heroImage: "/images/mekong_nam_bo.jpg",
      heroCaption: "Hương vị đám giỗ miền Tây: Nồi thịt kho nước dừa, đĩa bánh tét và tình làng nghĩa xóm sum vầy.",
      heroArtCredit: "Ảnh minh họa trong bản thử nghiệm",
      meaningTitle: "Ăn giỗ phương Nam — Ngày hội của tình thân",
      meaningParagraphs: [
        "Người phương Nam quan niệm 'sống sao chết vậy'. Ngày giỗ là ngày mời người xưa về ăn bữa cơm thân mật cùng con cháu. Mâm cỗ giỗ không câu nệ sự kiểu cách mà đề cao sự hào sảng, tươi ngon và bàn tay chăm chút của các thế hệ.",
        "Sau khi cúng gia tiên, mâm cỗ được dọn ra đãi đằng bà con họ hàng, lối xóm. Mọi người ngồi lại cùng nhau hỏi thăm mùa màng, công việc, chia sẻ ngọt bùi với tinh thần trượng nghĩa, bao dung.",
      ],
      meaningQuote:
        "Ăn quả nhớ kẻ trồng cây, uống nước nhớ nguồn — tấm lòng thảo thơm phương Nam mênh mang tựa dòng phù sa châu thổ.",
      checklists: [
        { id: "cg-1", label: "Chuẩn bị các món đặc trưng: thịt kho tàu hột vịt, canh khổ qua, cá lóc nướng/kho" },
        { id: "cg-2", label: "Dọn dẹp bàn thờ gia tiên sạch sẽ, dâng hoa huệ trắng và nải chuối vàng" },
        { id: "cg-3", label: "Dâng mâm cơm cúng lên bàn thờ trước giờ ngọ (trước 12h trưa)" },
        { id: "cg-4", label: "Thắp hương bái tạ, tưởng nhớ công đức dưỡng dục của tiền nhân" },
        { id: "cg-5", label: "Mời bà con, chòm xóm cùng tề tựu dùng bữa sum vầy" },
      ],
      safetyTip: "Khi nấu nướng lượng lớn món ăn ngày giỗ, chú ý an toàn gas và thông gió bếp.",
      offeringAdvice: "Mâm cỗ có đủ bốn món truyền thống Nam Bộ: món kho, món canh, món xào và món gỏi luộc.",
      offerings: [
        {
          id: "cg-off-1",
          name: "Thịt heo kho nước dừa (thịt kho rệu)",
          subname: "Miếng thịt vuông trứng tròn",
          desc: "Tượng trưng cho sự vuông tròn, vẹn toàn và sung túc trong gia đạo.",
        },
        {
          id: "cg-off-2",
          name: "Tô canh khổ qua dồn thịt",
          subname: "Hương vị dân dã",
          desc: "Ý niệm cầu mong mọi điều khổ ải, gian khó trong đời trôi qua, nhường chỗ cho sự ngọt lành.",
        },
      ],
      steps: [
        {
          stepNumber: "01",
          title: "Sửa soạn nguyên liệu thảo thơm",
          desc: "Có thể chọn thực phẩm phù hợp với thời gian, điều kiện và tập tục tại nơi bạn sống.",
        },
        {
          stepNumber: "02",
          title: "Bày biện mâm cúng trang trọng",
          desc: "Bày các món ăn lên đĩa sạch, sắp xếp ngay ngắn trên bàn thờ cùng chén nước trong và đĩa hoa tươi.",
        },
        {
          stepNumber: "03",
          title: "Thắp nén hương thành kính",
          desc: "Đại diện gia đình thắp hương, khấn nguyện mời gia tiên về thụ hưởng và phù hộ độ trì cho con cháu.",
        },
        {
          stepNumber: "04",
          title: "Đãi đằng sum họp chòm xóm",
          desc: "Hạ mâm cỗ, dọn bàn mời họ hàng và lối xóm cùng chung vui, gắn kết nghĩa tình bền chặt.",
        },
      ],
      regionalDetails: [
        { region: "Tây Nam Bộ", desc: "Đám giỗ thường có thêm bánh tét lá cẩm, bánh ít trần và đĩa cá lóc đồng thơm phức." },
        { region: "Đông Nam Bộ", desc: "Kết hợp hài hòa món cuốn bánh tráng, gỏi ngó sen tôm thịt thanh mát, đậm đà tình thân." },
      ],
      fireSafetyRules: [
        "Kiểm tra khóa van bình gas cẩn thận sau khi nấu nướng phục vụ đám giỗ đông người.",
        "Bát hương sau khi thắp nhiều nén cần theo dõi để không cháy lan sang giấy tờ.",
      ],
      closingQuote:
        "Bát canh khổ qua cho qua mọi nỗi khổ, đĩa thịt kho rệu vẹn tròn tình thân; đám giỗ phương Nam ấm lòng chòm xóm.",
      prayers: [
        {
          id: "prayer-cung-gio-nam-bo",
          title: "Văn khấn Cúng Giỗ Gia Tiên phương Nam (Chính kỵ)",
          kind: "Văn khấn nôm",
          applicableTo: "Đám giỗ chính kỵ người thân tại gia đình miền Nam",
          paragraphs: [
            "Nam mô A Di Đà Phật! (3 lần, 3 lạy)",
            "Con kính lạy chín phương Trời, mười phương Chư Phật.",
            "Con kính lạy Bản gia Thổ địa, Long Mạch Tôn thần, Táo phủ Thần quân cai quản khu vực bản gia.",
            "Con kính lạy Cửu Huyền Thất Tổ nội ngoại, chư vị Hương linh tiền hiền hậu tổ.",
            "Hôm nay ngày ... tháng ... âm lịch, là ngày húy nhật (chính kỵ) của: cố ... (nêu rõ vai vế và danh tính người quá cố).",
            "Thiết nghĩ người xưa khuất bóng, sông dài biển rộng ơn sâu. Nay con cháu chúng con nhớ ngày giỗ thác, một lòng thảo kính, sắm sửa mâm cơm gia đình: thịt kho nước dừa, canh khổ qua, bánh trái phương Nam kính dâng trước hương án.",
            "Kính cẩn mời chân linh cố ... cùng chư vị tiên tổ nội ngoại giáng lâm trước án, chứng giám tấc lòng thơm thảo, thụ hưởng lễ vật.",
            "Cúi xin người xưa linh thiêng độ trì cho con cháu gia đạo an khang, làm ăn phát đạt, sống thủy chung trọn nghĩa vẹn tình như nếp nhà bao đời phương Nam gìn giữ.",
            "Dãi tấm lòng thành, cúi xin chứng giám. Cẩn cáo!"
          ],
          usageNote: "Đọc trước giờ ngọ (khoảng 10h30 - 11h30 trưa) khi dâng mâm cỗ cúng.",
          metadata: createPrayerMeta(
            "Văn Hóa Phong Tục Đất Phương Nam",
            "Sơn Nam",
            "Khảo cứu tâm thức cúng giỗ thảo thơm, trượng nghĩa của người dân Nam Bộ."
          ),
        },
      ],
    },
  },
  {
    id: "ta-on-nha-moi",
    title: "Nghi thức tạ ơn và chuyển về nhà mới",
    badge: "Dịp gia đình • An cư",
    badgeType: "family",
    tagOnImage: "Thích ứng đô thị",
    stepsCount: "4 bước an tâm",
    timeEstimate: "45 phút",
    desc: "Các bước nhóm bếp ấm, đun siêu nước sôi và gửi gắm tâm niệm bình an khi bắt đầu nếp sống tại nơi ở mới.",
    image: "/images/hue_trung_bo.jpg",
    tagPill: "KHỞI ĐẦU HANH THÔNG",
    actionText: "Xem hướng dẫn",
    occasion: "Dịp gia đình",
    region: "Thích ứng đa vùng",
    detail: {
      fullTitle: "Nghi thức nhập trạch nhà mới: Khởi đầu an cư & Đón vượng khí cát tường",
      subtitle:
        "Chuyển về nơi ở mới là cột mốc quan trọng của đời người. Bằng những hành động tượng trưng ấm áp: mang bếp lửa, đun ấm nước sôi và dâng nén trầm an trú, hướng dẫn này giúp bạn vững tâm bắt đầu nếp sống mới.",
      heroImage: "/images/hue_trung_bo.jpg",
      heroCaption: "Không gian tổ ấm mới: Ánh sáng chan hòa, gian bếp ấm cúng và sự an tâm nơi chốn đi về.",
      heroArtCredit: "Ảnh minh họa trong bản thử nghiệm",
      meaningTitle: "An cư lạc nghiệp — Thổi hồn cho mái ấm",
      meaningParagraphs: [
        "Người xưa dạy 'An cư mới lạc nghiệp'. Nghi thức chuyển về nhà mới (nhập trạch) về bản chất là việc đánh thức sinh khí cho ngôi nhà, xua đi sự lạnh lẽo của công trình xây dựng và mang lại hơi ấm của sự sống con người.",
        "Không cần mâm cao cỗ đầy hay thầy cúng phức tạp, chính tâm niệm yêu thương, trân trọng tổ ấm của gia chủ cùng ngọn lửa bếp ấm và lời chúc lành của người thân là nguồn năng lượng phong thủy tốt đẹp nhất.",
      ],
      meaningQuote:
        "An cư lạc nghiệp nơi đất lành, bếp hồng lửa ấm đượm nghĩa tình. Khởi đầu thuận buồm xuôi gió, mái ấm vững chãi muôn năm.",
      checklists: [
        { id: "nm-1", label: "Mang bếp lửa (hoặc ấm đun nước) và gạo, muối vào nhà đầu tiên" },
        { id: "nm-2", label: "Mở rộng tất cả cửa sổ và bật sáng các bóng đèn để đón sinh khí" },
        { id: "nm-3", label: "Đun một siêu nước sôi reo trên bếp, tượng trưng cho ấm no và tài lộc dồi dào" },
        { id: "nm-4", label: "Dâng đĩa ngũ quả, hoa tươi và chén nước sạch tạ ơn trời đất, tiền chủ" },
        { id: "nm-5", label: "Thắp nén trầm thơm thanh lọc không gian, cầu chúc gia đạo an khang" },
      ],
      safetyTip:
        "Trước khi dùng lửa hoặc đốt hương, kiểm tra quy định của nơi ở. Giữ thiết bị báo khói hoạt động bình thường. Nếu sử dụng nến, đặt trên giá đỡ vững chắc, tránh vật dễ cháy và tắt trước khi rời phòng.",
      offeringAdvice: "Lễ vật tinh gọn: đĩa hoa tươi, đĩa ngũ quả, chén muối gạo, ấm nước đun sôi và nén hương mộc.",
      offerings: [
        {
          id: "nm-off-1",
          name: "Hũ gạo & Hũ muối đầy",
          subname: "No đủ & Trong lành",
          desc: "Tượng trưng cho sự no ấm, thanh sạch và vững bền không bao giờ thiếu thốn.",
        },
        {
          id: "nm-off-2",
          name: "Ấm nước đun sôi reo",
          subname: "Khởi sinh nhiệt huyết",
          desc: "Âm thanh nước sôi và hơi ấm mang ý nghĩa sinh sôi nảy nở, khai thông may mắn.",
        },
      ],
      steps: [
        {
          stepNumber: "01",
          title: "Đem lửa ấm vào nhà",
          desc: "Gia chủ mang bếp hoặc ấm đun nước vào nhà đầu tiên, bật bếp đun ấm nước sôi thể hiện ngọn lửa nếp nhà bắt đầu cháy sáng.",
        },
        {
          stepNumber: "02",
          title: "Mở rộng cửa & Đón dưỡng khí",
          desc: "Mở các cánh cửa sổ, bật quạt thoang thoảng để khí tươi lưu chuyển khắp các ngõ ngách căn hộ.",
        },
        {
          stepNumber: "03",
          title: "Dâng lễ tạ ơn mộc mạc",
          desc: "Đặt mâm hoa quả, chén nước trong lên bàn thờ/kệ trang nghiêm, thắp nén trầm thơm tạ ơn và khởi tâm an cư.",
        },
        {
          stepNumber: "04",
          title: "Ngồi lại thưởng trà ấm",
          desc: "Rót chén nước ấm vừa đun mời các thành viên cùng uống, cảm nhận niềm hạnh phúc dưới mái nhà thân yêu.",
        },
      ],
      regionalDetails: [
        { region: "Bắc Bộ", desc: "Chú trọng giờ hoàng đạo nhập trạch, mang chiếu hoặc đệm mới vào trước, dâng hương trầm thơm ngát." },
        { region: "Trung Bộ", desc: "Đun siêu nước sôi sùng sục, rắc một chút muối gạo quanh góc nhà xua tan khí lạnh cũ." },
        { region: "Nam Bộ", desc: "Phóng khoáng, chuộng mua chậu hoa mai/vạn thọ đặt trước cửa, bật nhạc êm dịu tạo cảm giác rộn ràng ấm áp." },
      ],
      fireSafetyRules: [
        "Luôn có người túc trực bên bếp khi đun nước lần đầu ở căn nhà mới.",
        "Bố trí bình cứu hỏa mini ở vị trí dễ thấy trong gian bếp gia đình.",
      ],
      closingQuote:
        "Nhập trạch đun sôi ấm nước reo, đón vượng khí lành xua tan băng giá; gia đạo bình an, phúc lộc vững bền.",
      prayers: [
        {
          id: "prayer-nhap-trach-than-linh",
          title: "Văn khấn Nhập Trạch Tạ Ơn Thần Linh (Về nhà mới)",
          kind: "Văn khấn nôm",
          applicableTo: "Lễ nhập trạch khi dọn về nhà mới hoặc căn hộ chung cư mới",
          paragraphs: [
            "Nam mô A Di Đà Phật! (3 lần, 3 lạy)",
            "Con kính lạy chín phương Trời, mười phương Chư Phật.",
            "Con kính lạy Hoàng thiên Hậu thổ chư vị Tôn thần.",
            "Con kính lạy ngài Bản cảnh Thành hoàng, ngài Định phúc Táo quân, ngài Bản xứ Thổ địa Long Mạch Tôn thần cai quản khu vực bản gia.",
            "Tín chủ con là: ..., cùng toàn thể gia quyến cư ngụ tại: ...",
            "Hôm nay ngày lành tháng tốt, gia đình chúng con hoàn tất việc dọn về nơi ở mới tại địa chỉ nêu trên.",
            "Chúng con thiết lập hương án, sắm sửa mâm lễ hoa quả tươi sạch, hũ muối hũ gạo đầy, châm ngọn lửa bếp ấm và đun siêu nước sôi reo, kính cẩn dâng lên trước án.",
            "Tạ ơn trời đất thần linh đã phù hộ độ trì cho gia đình con có được chốn an cư lạc nghiệp.",
            "Cúi xin các ngài giáng lâm trước án, chứng giám lòng thành, thụ hưởng lễ vật; phù hộ độ trì cho gia đình chúng con từ nay về sau cư ngụ nơi đây được bình an, mạnh khỏe, gia đạo êm ấm, tài lộc hanh thông, vượng khí sinh sôi.",
            "Dãi tấm lòng thành, cúi xin chứng giám. Cẩn cáo!"
          ],
          usageNote: "Đọc sau khi đã mang bếp vào nhà và đun sôi ấm nước đầu tiên.",
          metadata: createPrayerMeta(
            "Văn Khấn Cổ Truyền Việt Nam",
            "NXB Văn Hóa Thông Tin",
            "Nghi thức văn khấn lễ Nhập trạch tạ ơn Thổ thần đất mới."
          ),
        },
        {
          id: "prayer-nhap-trach-gia-tien",
          title: "Văn khấn Cáo Yết Gia Tiên khi về nhà mới",
          kind: "Văn khấn nôm",
          applicableTo: "An vị bàn thờ Tiên Tổ tại nơi ở mới",
          paragraphs: [
            "Nam mô A Di Đà Phật! (3 lần, 3 lạy)",
            "Kính lạy Tổ tiên nội ngoại chư vị Hương linh dòng họ ...",
            "Hôm nay ngày lành tháng tốt, con cháu chúng con đã hoàn tất việc chuyển dọn về nơi ở mới khang trang, sạch sẽ tại: ...",
            "Chúng con kính cẩn lau dọn hương án, dâng nén tâm hương và đĩa quả ngọt, kính rước chân linh tổ tiên cùng về nơi ở mới ngự tọa trên bàn thờ gia tiên.",
            "Cúi xin tiên tổ chứng giám tấc lòng hiếu thảo, phù hộ độ trì cho con cháu ở nơi mới luôn hòa thuận, khỏe mạnh, học hành công tác tiến bộ, gia môn hưng vượng.",
            "Lễ bạc tâm thành, cúi xin chứng giám. Cẩn cáo!"
          ],
          usageNote: "Đọc sau bài khấn Thần Linh, hoàn tất việc an vị bát hương gia tiên.",
          metadata: createPrayerMeta(
            "Nếp Cũ: Phong Tục Thờ Cúng Gia Tiên",
            "Toan Ánh",
            "Bài khấn cáo yết tổ tiên an vị bát hương tại gia cư mới."
          ),
        },
      ],
    },
  },
  {
    id: "chuan-bi-dong-tho",
    title: "Chuẩn bị dịp động thổ",
    badge: "Khởi tạo & Động thổ",
    badgeType: "occasion",
    subBadgeOccasion: "Động thổ",
    tagOnImage: "Nghi lễ khởi công",
    stepsCount: "4 bước chuẩn mực",
    timeEstimate: "Buổi sáng giờ hoàng đạo",
    desc:
      "Hướng dẫn sắm sửa mâm lễ động thổ trang nghiêm, nghi thức cuốc nhát đất đầu tiên và bài văn khấn Thần Linh Thổ Địa phù trợ thi công an toàn, vạn sự hanh thông.",
    image: "/images/do_paper_still_life.jpg",
    tagPill: "CHUẨN BỊ CHU ĐÁO",
    actionText: "Xem hướng dẫn",
    occasion: "Động thổ",
    region: "Thích ứng đa vùng",

    metadata: {
      contentKind: "editorial",
      editorialStatus: "in-review",
      quotationVerified: false,
      sources: [
        {
          id: "src-dong-tho",
          title: "Nghi Lễ Khởi Công Động Thổ Truyền Thống",
          authorOrOrganization: "Viện Nghiên Cứu Văn Hóa Dân Gian",
        },
      ],
      editorialNote:
        "Nội dung chuẩn hóa theo nghi thức động thổ cổ truyền Việt Nam, kết hợp các quy chuẩn an toàn lao động và bảo vệ môi trường hiện đại.",
    },

    detail: {
      fullTitle: "Nghi thức động thổ khởi công: Cáo yết Thần Linh & Cầu an xây dựng",
      subtitle:
        "Khởi công xây dựng là bước ngoặt trọng đại của đời người. Bằng sự thành kính xin phép các vị Thần Linh Thổ Địa cai quản khu đất, hướng dẫn này giúp gia chủ an tâm tổ chức buổi lễ trang nghiêm, chu toàn và hanh thông.",

      heroImage: "/images/do_paper_still_life.jpg",
      heroCaption:
        "Bàn lễ động thổ trang nghiêm giữa khu đất: Hương hoa trà quả thanh tịnh cầu chúc công trình thi công an toàn, vững bền.",
      heroArtCredit: "Ảnh minh họa trong bản thử nghiệm",

      meaningTitle: "Đất lành dựng nghiệp — Đạo lý kính trọng tự nhiên",
      meaningParagraphs: [
        "Theo tín ngưỡng dân gian lâu đời của người Việt, mỗi mảnh đất đều có Thần linh, Thổ địa và Long Mạch cai quản. Nghi thức động thổ (đào nhát đất đầu tiên) là lời cáo yết kính cẩn xin phép các đấng bề trên và các vị tiền chủ khu đất, xin phép được khởi tạo công trình trên mảnh đất ấy.",
        "Nghi lễ không chỉ mang ý nghĩa tâm linh cầu cho việc thi công 'thuận buồm xuôi gió', thợ thuyền an toàn khỏe mạnh, mà còn nhắc nhở gia chủ về lòng khiêm cung, hòa thuận với thiên nhiên và trân quý từng tấc đất sinh sống.",
      ],
      meaningQuote:
        "Vạn sự khởi đầu nan, đất lành chở che nền móng vững; khởi công tấc dạ kính trời đất, xây đắp tương lai rực rỡ bền lâu.",

      checklists: [
        {
          id: "dt-1",
          label: "Chọn ngày lành tháng tốt và giờ hoàng đạo hợp tuổi gia chủ khởi công",
        },
        {
          id: "dt-2",
          label: "Dọn dẹp mặt bằng khu đất sạch sẽ, dựng bàn lễ ở vị trí trung tâm trang nghiêm",
        },
        {
          id: "dt-3",
          label: "Sắm sửa mâm ngũ quả tươi, bình hoa tươi, trầu cau và chén rượu nước trong",
        },
        {
          id: "dt-4",
          label: "Chuẩn bị mâm cỗ mặn (gà luộc, xôi gấc) hoặc mâm cỗ chay thanh khiết theo nếp nhà",
        },
        {
          id: "dt-5",
          label: "Chuẩn bị cuốc/xẻng mới quấn nơ đỏ cho nghi thức cuốc nhát đất đầu tiên",
        },
        {
          id: "dt-6",
          label: "Đại diện gia chủ thắp hương đọc văn khấn và thực hiện nhát cuốc mở móng",
        },
      ],

      safetyTip:
        "Khu vực công trường cần dọn sạch sắt thép, chướng ngại vật; người tham gia nghi lễ đứng ở vị trí an toàn, cách xa máy móc cơ giới và hố sâu thi công.",

      offeringsTitle: "Mâm lễ vật động thổ truyền thống",

      offeringAdvice:
        "Lễ vật chuộng sự sạch sẽ, tươi mới và thành tâm. Tùy điều kiện có thể làm lễ mặn hoặc lễ chay thanh khiết; điều cốt lõi nhất là tấm lòng kính cẩn và ý thức an toàn công trình.",

      offerings: [
        {
          id: "dt-off-1",
          name: "Mâm ngũ quả tươi ngon",
          subname: "Ngũ hành tương sinh",
          desc: "Năm loại quả tươi màu sắc hài hòa (chuối, bưởi, táo, xoài, đu đủ...); tươi mới còn nguyên cuống.",
        },
        {
          id: "dt-off-2",
          name: "Bình hoa tươi thơm ngát",
          subname: "Hoa cúc / Hoa lay ơn",
          desc: "Bình hoa cúc vàng tinh khôi hoặc lay ơn rực rỡ, tượng trưng cho sự trường tồn và may mắn.",
        },
        {
          id: "dt-off-3",
          name: "Đĩa xôi gấc & Gà luộc nguyên con",
          subname: "(hoặc mâm cỗ chay thanh tịnh)",
          desc: "Xôi gấc đỏ mang lại may mắn cát tường; gà luộc thế chân quỳ cánh tiên ngay ngắn.",
        },
        {
          id: "dt-off-4",
          name: "Đĩa trầu cau & Rượu nước",
          subname: "Phong tục cổ truyền",
          desc: "Đĩa trầu cau tươi têm cánh phượng, 3 chén rượu trắng, 3 chén nước lọc tinh khiết và đĩa muối gạo.",
        },
        {
          id: "dt-off-5",
          name: "Nén hương mộc & Cặp nến thắp sáng",
          subname: "Đèn nhang linh thiêng",
          desc: "Hương trầm mộc tự nhiên thắp sáng tâm linh, cặp nến soi sáng khởi đầu hanh thông.",
        },
      ],

      steps: [
        {
          stepNumber: "01",
          title: "Chọn giờ hoàng đạo & Sắp đặt bàn lễ",
          desc:
            "Đặt bàn lễ ở vị trí cao ráo tại tâm khu đất xây dựng, bày biện hoa quả, cỗ cúng ngay ngắn trước giờ lành.",
        },
        {
          stepNumber: "02",
          title: "Thắp nén tâm hương cáo yết",
          desc:
            "Đúng giờ hoàng đạo, gia chủ hoặc người đại diện thắp hương, vái 3 vái và đọc bài văn khấn Động Thổ chí thành.",
        },
        {
          stepNumber: "03",
          title: "Nghi thức cuốc nhát đất đầu tiên",
          desc:
            "Sau khi hương cháy quá nửa, gia chủ cầm cuốc/xẻng mới tự tay đào tượng trưng 3 hoặc 5 nhát vào vị trí đặt móng chính.",
        },
        {
          stepNumber: "04",
          title: "Rải muối gạo & Khởi công thi công",
          desc:
            "Gia chủ rải một chút muối gạo quanh khu đất tạ ơn tiền chủ, mời thợ thuyền cùng bắt tay vào công việc trong niềm vui hân hoan.",
        },
      ],

      regionalDetails: [
        {
          region: "Bắc Bộ",
          desc:
            "Chuộng gà trống thiến luộc ngậm hoa hồng đỏ, đĩa xôi gấc đỏ tươi, đĩa trầu cau tươi têm cánh phượng và tuân thủ chặt chẽ giờ hoàng đạo xuất hành cuốc đất.",
        },
        {
          region: "Trung Bộ",
          desc:
            "Bàn lễ dung dị với nén trầm xứ Quảng đượm hương, đĩa xôi gà hoặc thịt luộc, đĩa muối gạo rải đều quanh 4 góc khu đất sau khi hoàn tất nghi lễ.",
        },
        {
          region: "Nam Bộ",
          desc:
            "Thường dâng thêm bộ tam sên, nải chuối sứ vàng ươm và bánh tét; sau lễ gia chủ hào sảng thết đãi thợ thuyền ăn uống rôm rả gắn kết nghĩa tình.",
        },
      ],

      fireSafetyRules: [
        "Đặt bàn lễ và bát hương ở vị trí bằng phẳng, tránh gió lùa mạnh làm đổ nến hay tàn nhang bén vào cỏ khô xung quanh.",
        "Tuyệt đối không đốt vàng mã cạnh các vật liệu thi công dễ cháy như gỗ cốp pha, bạt che hay thùng sơn.",
        "Chờ tàn hương tắt hẳn hoàn toàn và kiểm tra kỹ lưỡng trước khi rời khu vực công trường.",
      ],

      closingQuote:
        "Động thổ thuận hòa, thi công bình an, trên dưới đồng lòng, ngôi nhà vững chãi muôn năm.",

      prayers: [
        {
          id: "prayer-dong-tho-xay-dung",
          title: "Văn khấn Lễ Động Thổ Khởi Công Xây Dựng",
          kind: "Văn khấn nôm",
          applicableTo: "Lễ động thổ làm nhà mới, sửa chữa nhà hoặc khởi công công trình xây dựng",
          paragraphs: [
            "Nam mô A Di Đà Phật! (3 lần, 3 lạy)",
            "Con kính lạy chín phương Trời, mười phương Chư Phật.",
            "Con kính lạy Hoàng thiên Hậu thổ chư vị Tôn thần.",
            "Con kính lạy Quan Đương niên Hành khiển, Quan Đương cảnh Thành hoàng chư vị Đại Vương.",
            "Con kính lạy ngài Định phúc Táo quân, ngài Bản xứ Thần linh Thổ địa, Long Mạch Tôn thần cùng chư vị Tôn thần cai quản khu đất này.",
            "Tín chủ con là: ..., cùng gia đình và ban thi công công trình, ngụ tại: ...",
            "Hôm nay ngày ... tháng ... năm ..., gặp giờ hoàng đạo cát tường.",
            "Tín chủ con khởi tâm xây cất/sửa chữa ngôi nhà tại khu đất này. Nay sắm sửa hương hoa trà quả, xôi gà phẩm vật lòng thành, thiết lập bàn lễ kính dâng trước án.",
            "Kính cẩn kính cáo các ngài giáng lâm trước án, chứng giám tấc lòng thành, thụ hưởng lễ vật; cho phép tín chủ con được khởi công động thổ, cuốc nhát đất đầu tiên khai móng công trình.",
            "Cầu xin chư vị Thần linh che chở cho thợ thuyền khỏe mạnh, công trình thi công thuận buồm xuôi gió, tai qua nạn khỏi, tiến độ hanh thông, công trình vững chãi; độ cho gia chủ sau này về ở được an cư lạc nghiệp, gia đạo hưng long, phúc lộc song toàn.",
            "Dãi tấm lòng thành, cúi xin chứng giám. Cẩn cáo!"
          ],
          usageNote: "Gia chủ hoặc chủ thầu đứng trước bàn lễ đọc to, rõ ràng, trang nghiêm trước khi cuốc đất.",
          metadata: createPrayerMeta(
            "Văn Khấn Cổ Truyền Việt Nam",
            "NXB Văn Hóa Thông Tin",
            "Văn bản nghi thức Động thổ khởi công chuẩn mực cổ truyền."
          ),
        },
      ],
    },
  },
];

export function getRitualById(id: string): RitualGuideItem | undefined {
  if (!id) return undefined;
  const normalized = id.trim().toLowerCase();
  return (
    RITUAL_GUIDES.find((item) => item.id === id) ||
    RITUAL_GUIDES.find((item) => item.id.toLowerCase() === normalized) ||
    RITUAL_GUIDES.find((item) => slugify(item.title) === slugify(id)) ||
    RITUAL_GUIDES.find((item) => item.title.toLowerCase().includes(normalized) || normalized.includes(item.id.toLowerCase()))
  );
}

const asText = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const slugify = (value: string) => value.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[đĐ]/g, "d")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

export function adaptRemoteRitual(item: RemoteContentItem): RitualGuideItem {
  const id = asText(item.slug, item.id);
  const details = asRecord(item.detail);
  const imageMetadata = asRecord(item.imageMetadata);
  const rawOfferings = asArray(item.offerings);
  const rawSteps = asArray(item.steps);
  const rawPrayers = asArray(item.prayers);
  const local =
    getRitualById(asText(item.slug)) ||
    getRitualById(asText(item.id)) ||
    getRitualById(asText(item.title));
  const localDetail = local?.detail;

  const remoteOfferings: RitualOfferingItem[] = rawOfferings.map((value) => {
    const offering = asRecord(value);
    const name = asText(offering.name);
    return {
      id: asText(offering.id),
      name,
      subname: asText(offering.quantity),
      desc: asText(offering.desc),
    };
  }).filter((offering) => Boolean(offering.name));
  const offerings = remoteOfferings.length ? remoteOfferings : (localDetail?.offerings || []);

  const checklists: RitualChecklistItem[] = asArray(item.checklists)
    .map((value) => {
      const checklistItem = asRecord(value);
      return { id: asText(checklistItem.id), label: asText(checklistItem.label) };
    })
    .filter((checklistItem) => Boolean(checklistItem.id && checklistItem.label));
  const finalChecklists = checklists.length ? checklists : (localDetail?.checklists || []);

  const remoteSteps: RitualStep[] = rawSteps.map((value, index) => {
    const step = asRecord(value);
    return {
      stepNumber: asText(step.stepNumber, String(index + 1)),
      title: asText(step.title),
      desc: asText(step.desc),
    };
  }).filter((step) => Boolean(step.title && step.desc));
  const steps = remoteSteps.length ? remoteSteps : (localDetail?.steps || []);

  const remotePrayers: RitualPrayer[] = rawPrayers.map((value, index): RitualPrayer => {
    const prayer = asRecord(value);
    const review = asRecord(prayer.reviewMetadata);
    const title = asText(prayer.title);
    const content = asText(prayer.content);
    const sourceUrl = asText(prayer.source);
    const hasReview = prayer.verified === true && Boolean(review.rightsConfirmed === true && review.sourceLocator && review.reviewedBy && review.reviewedOn);
    const rightsStatus = asText(review.usageRights, "unknown") as NonNullable<ContentMetadata["usageRights"]>["status"];
    return {
      id: `${id}-prayer-${slugify(title) || index + 1}`,
      preview: prayer.preview === true,
      title,
      kind: "Văn khấn",
      applicableTo: asText(prayer.applicableTo, asText(item.title)),
      paragraphs: content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
      usageNote: asText(prayer.usageNote),
      metadata: {
        contentKind: "editorial",
        editorialStatus: hasReview ? "published" : "in-review",
        quotationVerified: false,
        reviewedBy: asText(review.reviewedBy) || undefined,
        reviewedOn: asText(review.reviewedOn) || undefined,
        usageRights: hasReview ? { status: rightsStatus, note: asText(review.reviewNote) } : undefined,
        sources: sourceUrl ? [{
          id: `${id}-prayer-source-${index + 1}`,
          title: sourceUrl,
          url: sourceUrl,
          ...(asText(review.sourceLocator) ? { locator: asText(review.sourceLocator) } : {}),
        }] : [],
        editorialNote: hasReview ? asText(review.reviewNote, "Nguồn và quyền sử dụng đã được duyệt.") : "Nội dung do BE cung cấp; đang chờ biên tập và thẩm định.",
      },
    };
  }).filter((prayer) => Boolean(prayer.title && prayer.paragraphs.length));
  const prayers = remotePrayers.length ? remotePrayers : (localDetail?.prayers || []);

  const regionName = asText(item.region);
  const region: RitualRegionKey = regionName === "Toàn quốc" || regionName === "NATIONWIDE"
    ? "Thích ứng đa vùng"
    : (["Bắc Bộ", "Trung Bộ", "Nam Bộ"].includes(regionName) ? regionName as RitualRegionKey : (local?.region || "all"));
  const occasionName = asText(item.occasion);
  const occasion: RitualOccasionKey = (["Rằm", "Mùng một", "Tết Nguyên Đán", "Dịp gia đình", "Động thổ"].includes(occasionName)
    ? occasionName
    : (local?.occasion || "all")) as RitualOccasionKey;
  const imageApproved = imageMetadata.approved === true || local?.imageApproved === true;
  const image = imageApproved ? asText(item.imageUrl, asText(item.image)) || (local?.image || "") : (local?.image || "");
  const title = asText(item.title) || local?.title || "Hướng dẫn nghi lễ";
  const desc = asText(item.desc) || local?.desc || title;
  const verified = item.verified === true;
  const ritualReview = asRecord(item.reviewMetadata);
  const provenance = asRecord(item.contentProvenance);
  const ritualContentType = asText(provenance.contentType) as ContentMetadata["contentType"];
  const groupAuthored = ritualContentType === "GROUP_AUTHORED";
  const hasRitualReview = verified
    && ritualReview.rightsConfirmed === true
    && Boolean(ritualReview.reviewedBy)
    && Boolean(ritualReview.reviewedOn)
    && (groupAuthored || Boolean(ritualReview.sourceLocator));
  const ritualRights = asText(ritualReview.usageRights, "unknown") as NonNullable<ContentMetadata["usageRights"]>["status"];
  const metadata: ContentMetadata = {
    contentKind: "editorial",
    editorialStatus: hasRitualReview ? "published" : "in-review",
    quotationVerified: false,
    contentType: ritualContentType,
    contentAuthor: asText(provenance.authorOrOrganization) || undefined,
    contentRightsBasis: asText(provenance.contentRightsBasis) || undefined,
    scope: asText(provenance.scope) || undefined,
    reviewedBy: asText(ritualReview.reviewedBy) || undefined,
    reviewedOn: asText(ritualReview.reviewedOn) || undefined,
    usageRights: hasRitualReview && !groupAuthored ? { status: ritualRights, note: asText(ritualReview.reviewNote) } : undefined,
    sources: !groupAuthored && asText(item.source) ? [{ id: `${id}-source`, title: asText(item.source), ...(asText(item.source).startsWith("https://") ? { url: asText(item.source) } : {}), ...(asText(ritualReview.sourceLocator) ? { locator: asText(ritualReview.sourceLocator) } : {}) }] : [],
    editorialNote: hasRitualReview ? asText(ritualReview.reviewNote) : "",
  };
  const stepCount = steps.length;
  return {
    id: local?.id || id,
    title,
    preview: item.preview === true,
    subBadgeOccasion: local?.subBadgeOccasion || (occasion === "all" ? "" : occasion),
    tagOnImage: local?.tagOnImage || (region === "all" ? "" : region === "Thích ứng đa vùng" ? "Đa vùng thích ứng" : region),
    stepsCount: stepCount ? `${stepCount} bước` : (local?.stepsCount || "4 bước chuẩn bị"),
    timeEstimate: local?.timeEstimate || "15 - 20 phút",
    desc,
    image,
    imageApproved: true,
    tagPill: local?.tagPill || "TÂM THÀNH THANH TỊNH",
    actionText: "Xem hướng dẫn",
    occasion,
    region,
    metadata,
    detail: {
      fullTitle: asText(details.fullTitle, localDetail?.fullTitle || title),
      subtitle: asText(details.subtitle, localDetail?.subtitle || desc),
      heroImage: image || localDetail?.heroImage || "/images/ritual_ram.jpg",
      heroImageApproved: true,
      heroCaption: asText(imageMetadata.imageCaption, localDetail?.heroCaption || "Ảnh minh họa hướng dẫn nghi lễ tại gia thanh tịnh"),
      heroArtCredit: asText(imageMetadata.imageCredit, localDetail?.heroArtCredit || "Tin Lắm Tâm Linh"),
      heroSourceUrl: asText(imageMetadata.imageSource, localDetail?.heroSourceUrl || ""),
      heroRightsBasis: asText(imageMetadata.imageRightsBasis, localDetail?.heroRightsBasis || "Tư liệu thực hành nếp nhà"),
      meaningTitle: asText(details.meaningTitle, localDetail?.meaningTitle || "Ý nghĩa của nghi thức nếp nhà"),
      meaningParagraphs: asArray(details.meaningParagraphs).map((value) => asText(value)).filter(Boolean).length
        ? asArray(details.meaningParagraphs).map((value) => asText(value)).filter(Boolean)
        : (localDetail?.meaningParagraphs || [
            "Nghi lễ tại gia lấy chữ Tâm thành và nếp thanh tịnh làm trọng. Dù không gian rộng hay hẹp, lễ vật đơn sơ hay đầy đặn, lòng hiếu kính hướng về cội nguồn luôn là giá trị cốt lõi.",
            "Dành ít phút lắng đọng tâm tư, dọn sạch hương án và thắp nén tâm hương để kết nối các thành viên gia đình trong sự an hòa, thuận thảo."
          ]),
      meaningQuote: asText(details.meaningQuote, localDetail?.meaningQuote || "Tâm thành thấu cội nguồn, nếp nhà lưu phúc đức muôn đời."),
      checklists: finalChecklists,
      safetyTip: asText(details.safetyTip, localDetail?.safetyTip || "Luôn chú ý an toàn phòng cháy: đặt hương nến nơi vững chãi, cách xa rèm cửa và vật liệu dễ cháy; kiểm tra tàn lửa trước khi rời đi."),
      offeringsTitle: offerings.length ? (asText(details.offeringsTitle, localDetail?.offeringsTitle || "Lễ vật thanh tịnh & Cách chuẩn bị")) : "Lễ vật thanh tịnh & Cách chuẩn bị",
      offeringAdvice: asText(details.offeringAdvice, localDetail?.offeringAdvice || "“Lễ bạc lòng thành, cốt ở thanh tịnh”. Gia đình chuẩn bị vật phẩm tươi sạch, vừa sức, không cần mâm cao cỗ đầy cầu kỳ."),
      offerings,
      steps,
      regionalDetails: asArray(details.regionalDetails).map((value) => {
        const detail = asRecord(value);
        return { region: asText(detail.region), desc: asText(detail.desc) };
      }).filter((detail) => Boolean(detail.region && detail.desc)).length
        ? asArray(details.regionalDetails).map((value) => {
          const detail = asRecord(value);
          return { region: asText(detail.region), desc: asText(detail.desc) };
        }).filter((detail) => Boolean(detail.region && detail.desc))
        : (localDetail?.regionalDetails || [
            { region: "Bắc Bộ", desc: "Giữ nét trang nghiêm thanh tịnh, đĩa quả trầu cau tươm tất và nén hương mộc truyền thống." },
            { region: "Trung Bộ", desc: "Mộc mạc chân thành, chú trọng sự ấm cúng và những thức quả bánh quê nhà gắn liền cội nguồn." },
            { region: "Nam Bộ", desc: "Cởi mở hào sảng, hoa quả bốn mùa sung túc và tâm niệm hướng thiện, an vui cho gia đạo." }
          ]),
      fireSafetyRules: asArray(details.fireSafetyRules).map((value) => asText(value)).filter(Boolean).length
        ? asArray(details.fireSafetyRules).map((value) => asText(value)).filter(Boolean)
        : (localDetail?.fireSafetyRules || [
            "Không để hương thắp gần rèm cửa, giấy tờ hoặc vật liệu bắt lửa.",
            "Dùng bát hương có đế chống trượt hoặc bát hương gốm sứ vững chãi.",
            "Tắt đèn dầu hoặc thổi nến khi cả nhà ra ngoài hoặc đi ngủ."
          ]),
      closingQuote: asText(details.closingQuote, localDetail?.closingQuote || "Lấy tâm tĩnh tại làm gốc, an nhiên vui sống mỗi ngày."),
      prayers,
    },
  };
}
