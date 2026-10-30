import {
  createDemoMetadata,
  type ContentMetadata,
} from "./contentMetadata";
import checkInCatalog from "../../../shared/checkin-catalog.json";

export type MoodKey = (typeof checkInCatalog.moods)[number]["label"];

export const MOOD_CONTEXTS = checkInCatalog.contexts;

export type MoodContextKey =
  (typeof MOOD_CONTEXTS)[number]["key"];

export interface SignalData {
  resultToken?: string;
  id: string;
  contextKey?: MoodContextKey;
  metadata: ContentMetadata;
  aiExplanation?: {
    provider: string;
    reflection: string;
    action: { title: string; description: string };
  };
  mood: MoodKey;
  moodDesc: string;
  badge: string;
  poem: {
    line1: string;
    line2: string;
    subtext: string;
  };
  research: {
    title: string;
    source: string;
    region: string;
    note: string;
  };
  reflection: {
    title: string;
    highlightWord: string;
    content: string;
    advice: string;
    signalNumber: string;
  };
  action: {
    title: string;
    duration: string;
    description: string;
    buttonLabel: string;
    tag: string;
  };
  artwork: {
    tag: string;
    image: string;
    caption: string;
  };
  loadingFacts: {
    breathingText: string;
    thoughtTitle: string;
    thoughtContent: string;
    originTitle: string;
    originContent: string;
    stepText: string;
  };
  guestPreview: {
    title: string;
    message: string;
  };
}

const MOOD_PRESENTATION: Record<MoodKey, { desc: string; iconType: string }> = {
  "An yên": { desc: "Trái tim bình lặng, sẵn sàng đón nhận điều lành", iconType: "lotus" },
  "Chênh vênh": { desc: "Cảm giác mất thăng bằng, cần một neo đậu an lành", iconType: "waves" },
  "Băn khoăn": { desc: "Đứng trước ngã rẽ, cần góc nhìn sáng suốt và thấu đạt", iconType: "question" },
  "Nôn nóng": { desc: "Tâm trí hối hả, cần hạ nhịp thở và chậm lại từng giây", iconType: "wind" },
  "Biết ơn": { desc: "Tràn đầy cảm kích với những duyên lành nhỏ bé quanh mình", iconType: "heart" },
  "Cần điểm tựa": { desc: "Cần một lời động viên và một khoảng được lắng nghe", iconType: "moon" },
  "Áp lực": { desc: "Nhiều việc dồn lại, muốn nhẹ gánh hơn một chút", iconType: "wind" },
  "Cô đơn": { desc: "Muốn có một người lắng nghe và kết nối", iconType: "moon" },
  "Vui vẻ": { desc: "Có một niềm vui muốn tận hưởng hoặc chia sẻ", iconType: "lotus" },
  "Mông lung": { desc: "Chưa rõ hướng đi, muốn tìm một bước nhỏ tiếp theo", iconType: "question" },
};

export const MOODS_LIST: {
  key: MoodKey;
  name: string;
  desc: string;
  iconType: string;
}[] = checkInCatalog.moods.map(({ label }) => ({
  key: label,
  name: label,
  ...MOOD_PRESENTATION[label],
}));

export const ALL_SIGNALS: SignalData[] = [
  // 1. CHÊNH VÊNH - Signal 1
  {
    id: "chenh-venh-1",
    metadata: createDemoMetadata(),
    mood: "Chênh vênh",
    moodDesc: "Cảm giác mất thăng bằng, cần một neo đậu an lành",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Nước trong hoa nở ngát dòng",
      line2: "Tâm an vạn nẻo bụi trần hóa sen.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },
    research: {
      title: "VÙNG 2 • TƯ LIỆU THAM KHẢO & KHẢO CỨU",
      source: "Nội dung biên soạn minh họa",
      region: "Không gian văn hóa truyền thống Việt Nam",
      note: "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "chênh vênh",
      content:
        "Cảm giác chênh vênh có thể xuất hiện khi nhiều điều chưa rõ ràng. Bạn không cần tìm đủ mọi câu trả lời ngay hôm nay. Nếu thấy phù hợp, hãy dành một khoảng nghỉ ngắn, rồi chọn một việc nhỏ trong khả năng của mình để bắt đầu.",
      advice: "Gợi ý tiếp nhận: Đọc thong thả 2 lần trước khi chuyển động",
      signalNumber: "Chiêm nghiệm số #2409",
    },
    action: {
      title: "Thưởng chén nước ấm định tâm",
      duration: "3 PHÚT",
      description:
        "Rót một ly nước ấm, đặt hai bàn tay quanh thân cốc cảm nhận hơi ấm lan tỏa, uống chậm từng ngụm nhỏ và tạm thời gác lại mọi suy tính.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Gốm & Nước",
      image: "/images/tea_bowl.jpg",
      caption: "Họa phẩm cảm hứng: Bình yên bên giọt sương mai",
    },
    loadingFacts: {
      breathingText: "Thở ra, mỉm cười với hiện tại...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Nước lắng thấy trăng tỏ, lòng tịnh ắt thấy đường.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Chắt lọc thanh âm tĩnh tại từ mạch nguồn văn hóa...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN AN YÊN",
      message:
        "Thong thả đón gió, tâm thanh tịnh thì vạn sự hanh thông. Hệ thống sẵn sàng mở ra lá quẻ dân gian chúc lành cho bước chân của bạn.",
    },
  },
  // 1. CHÊNH VÊNH - Signal 2
  {
    id: "chenh-venh-2",
    metadata: createDemoMetadata(),
    mood: "Chênh vênh",
    moodDesc: "Cảm giác mất thăng bằng, cần một neo đậu an lành",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Gió lay cành trúc bên đồi",
      line2: "Cội sâu rễ chắc mặc đời chuyển rung.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },
    research: {
      title: "VÙNG 2 • TƯ LIỆU THAM KHẢO & KHẢO CỨU",
      source: "Nội dung biên soạn minh họa",
      region: "Không gian văn hóa truyền thống Việt Nam",
      note: "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "chênh vênh",
      content:
        "Cành trúc ngả nghiêng theo gió nhưng chẳng bao giờ gãy đổ bởi rễ đã bám sâu vào lòng đất mẹ. Chênh vênh chỉ là lớp sóng mặt ngoài, phẩm giá và bản lĩnh nội tại bên trong bạn vẫn vẹn nguyên vững chãi. Hãy hít một hơi thật sâu và tự nhắc nhở bản thân về cội nguồn bền bỉ này.",
      advice: "Gợi ý tiếp nhận: Đặt bàn chân trần chạm sàn nhà thật vững",
      signalNumber: "Chiêm nghiệm số #2410",
    },
    action: {
      title: "Đứng vững chãi như rễ tre 2 phút",
      duration: "2 PHÚT",
      description:
        "Tháo giày dép, đứng thẳng lưng hai chân mở rộng bằng vai, cảm nhận lòng bàn chân tiếp xúc mặt đất vững chắc, hít thở sâu thả lỏng vai.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Mộc & Trúc",
      image: "/images/temple_bac_bo.jpg",
      caption: "Họa phẩm cảm hứng: Cội trúc hiên chùa đón gió ngàn",
    },
    loadingFacts: {
      breathingText: "Hít sâu kiên định, thở nhẹ an lành...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Tâm bất biến giữa dòng đời vạn biến.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Soi tỏ sức mạnh tiềm ẩn trong im lặng...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN VỮNG CHÃI",
      message:
        "Dẫu gió ngả nghiêng, tâm bạn vẫn là một cội nguồn bất biến. Đón nhận tín hiệu neo giữ an bình cho hôm nay.",
    },
  },

  // 2. AN YÊN - Signal 1
  {
    id: "an-yen-1",
    metadata: createDemoMetadata(),
    mood: "An yên",
    moodDesc: "Trái tim bình lặng, sẵn sàng đón nhận điều lành",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Gió mát trăng thanh ngàn thuở rạng",
      line2: "Lòng không vướng bận giấc nồng say.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },
    research: {
      title: "VÙNG 2 • TƯ LIỆU THAM KHẢO & KHẢO CỨU",
      source: "Nội dung biên soạn minh họa",
      region: "Không gian văn hóa truyền thống Việt Nam",
      note: "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "an yên",
      content:
        "Nếu hôm nay bạn cảm thấy an yên, hãy thử nhận ra điều gì đang góp phần tạo nên cảm giác ấy: một khoảng nghỉ, một cuộc trò chuyện hay một việc đã hoàn thành. Bạn có thể ghi lại điều đó để hiểu thêm những gì giúp mình cảm thấy dễ chịu.",
      advice: "Gợi ý tiếp nhận: Giữ nụ cười mỉm trên môi trong 30 giây",
      signalNumber: "Chiêm nghiệm số #1080",
    },
    action: {
      title: "Gieo nụ cười vào không gian",
      duration: "2 PHÚT",
      description:
        "Nếu muốn, hít thở chậm vài nhịp hoặc nghĩ về điều bạn trân trọng lúc này.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Gốm & Sen",
      image: "/images/tea_bowl.jpg",
      caption: "Họa phẩm cảm hứng: Hương hoa đầu mùa thanh khiết",
    },
    loadingFacts: {
      breathingText: "Hít vào tĩnh lặng, thở ra nhẹ nhàng...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Tâm bình thế giới bình, hoa thơm tự nở ngát trời mây.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Chắt lọc thanh âm thiền trà sương sớm...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN AN YÊN",
      message:
        "Thong thả đón gió, tâm thanh tịnh thì vạn sự hanh thông. Hệ thống sẵn sàng mở ra lá quẻ dân gian chúc lành cho bước chân của bạn.",
    },
  },
  // 2. AN YÊN - Signal 2
  {
    id: "an-yen-2",
    metadata: createDemoMetadata(),
    mood: "An yên",
    moodDesc: "Trái tim bình lặng, sẵn sàng đón nhận điều lành",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Sớm mai mây lượn đầu non biếc",
      line2: "Tách trà nghi ngút nhẹ lòng son.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },
    research: {
      title: "VÙNG 2 • TƯ LIỆU THAM KHẢO & KHẢO CỨU",
      source: "Nội dung biên soạn minh họa",
      region: "Không gian văn hóa truyền thống Việt Nam",
      note: "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "an yên",
      content:
        "Niềm an yên đích thực không nằm ở chốn không có tiếng ồn, mà nằm ở chỗ giữa bao tiếng ồn ta vẫn giữ được nhịp thở khoan thai. Tách trà ấm trên tay chính là bài học hiện diện trọn vẹn trong khoảnh khắc này.",
      advice: "Gợi ý tiếp nhận: Nhìn ra bầu trời hoặc một bóng cây xanh",
      signalNumber: "Chiêm nghiệm số #1081",
    },
    action: {
      title: "Mở rộng tầm mắt nhìn mây trời",
      duration: "1 PHÚT",
      description:
        "Bước lại gần cửa sổ, ngước nhìn vòm trời hoặc một tán cây xanh, hít thở không khí tự nhiên và cảm nhận sự bao la của đất trời.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Sơn & Thủy",
      image: "/images/temple_bac_bo.jpg",
      caption: "Họa phẩm cảm hứng: Non xanh nước biếc một màu thảnh thơi",
    },
    loadingFacts: {
      breathingText: "Hơi thở nhẹ tênh như áng mây trôi...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Tâm rộng lượng thì đời thênh thang.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Mở rộng không gian tĩnh lặng trong lồng ngực...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN KHOÁNG ĐẠT",
      message:
        "Tâm hồn bạn lúc này như bầu trời mùa thu trong vắt. Tiếp tục nuôi dưỡng đóa an nhiên này mỗi ngày.",
    },
  },

  // 3. BĂN KHOĂN - Signal 1
  {
    id: "ban-khoan-1",
    metadata: createDemoMetadata(),
    mood: "Băn khoăn",
    moodDesc: "Đứng trước ngã rẽ, cần góc nhìn sáng suốt và thấu đạt",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Đường dài vạn dặm khởi đầu bước",
      line2: "Mây tỏ trăng soi lối định hình.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },
    research: {
      title: "VÙNG 2 • TƯ LIỆU THAM KHẢO & KHẢO CỨU",
      source: "Nội dung biên soạn minh họa",
      region: "Không gian văn hóa truyền thống Việt Nam",
      note: "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "băn khoăn",
      content:
        "Sự băn khoăn chứng tỏ bạn đang rất trân trọng các lựa chọn phía trước. Tiền nhân thường dạy: khi phân vân trước ngã rẽ, chớ vội chạy theo con đường ồn ào nhất, hãy lắng nghe tiếng vọng sâu kín của lương tri. Mọi quyết định xuất phát từ lòng chân thành đều mở ra trái ngọt.",
      advice: "Gợi ý tiếp nhận: Đặt tay lên lồng ngực cảm nhận nhịp đập",
      signalNumber: "Chiêm nghiệm số #3312",
    },
    action: {
      title: "Ghi lại ngã rẽ lương tâm",
      duration: "3 PHÚT",
      description:
        "Lấy giấy bút viết ra 2 lựa chọn đang khiến bạn băn khoăn nhất, bên cạnh mỗi việc hãy ghi lại giá trị chân thành bạn mong muốn giữ gìn.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Mộc & Giấy Dó",
      image: "/images/do_paper_still_life.jpg",
      caption: "Họa phẩm cảm hứng: Cội rễ bền bỉ soi đường chỉ lối",
    },
    loadingFacts: {
      breathingText: "Lắng tâm nghe tiếng thì thầm nội tại...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Tâm có định tuệ ắt sinh, chớ ngại bước chân do dự.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Soi tỏ kinh nghiệm cha ông ngàn đời...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN MINH TRIẾT",
      message:
        "Mỗi khúc mắc là hạt mầm cho sự thấu đạt. Lắng đọng tâm can để tiếp nhận lời nhắc nhở chân phương từ tích xưa.",
    },
  },
  // 3. BĂN KHOĂN - Signal 2
  {
    id: "ban-khoan-2",
    metadata: createDemoMetadata(),
    mood: "Băn khoăn",
    moodDesc: "Đứng trước ngã rẽ, cần góc nhìn sáng suốt và thấu đạt",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Gương trong không bụi soi tường tận",
      line2: "Dạ sáng như sao tỏ bước đường.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },
    research: {
      title: "VÙNG 2 • TƯ LIỆU THAM KHẢO & KHẢO CỨU",
      source: "Nội dung biên soạn minh họa",
      region: "Không gian văn hóa truyền thống Việt Nam",
      note: "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "băn khoăn",
      content:
        "Muốn lau sạch tấm gương soi, trước hết phải đợi cơn gió bụi ngừng thổi. Băn khoăn không thể giải quyết bằng sự bối rối dồn dập. Hãy dừng lại vài phút, để tâm trí nguội bớt; đáp án chân xác nhất thường xuất hiện khi bạn thôi căng thẳng tìm kiếm.",
      advice: "Gợi ý tiếp nhận: Nhắm mắt đếm chậm từ 10 lùi về 1",
      signalNumber: "Chiêm nghiệm số #3313",
    },
    action: {
      title: "Đếm nhịp thở 10 đến 1",
      duration: "2 PHÚT",
      description:
        "Ngồi thẳng lưng, nhắm mắt, hít vào thở ra đếm 10, tiếp tục đếm ngược dần về 1 để đưa tâm trí về trạng thái trung tính sáng suốt.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Đồng & Gương",
      image: "/images/tea_bowl.jpg",
      caption: "Họa phẩm cảm hứng: Gương đồng soi tỏ lòng chân thật",
    },
    loadingFacts: {
      breathingText: "Gạt bỏ bụi mờ, tâm trí sáng tỏ...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Tâm tịnh như nước hồ mùa thu.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Soi tỏ lòng mình trước khi định đoạt...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN SÁNG SUỐT",
      message:
        "Bụi mờ tan biến thì đường đi tự tỏ tường. Đón nhận tín hiệu khai tâm từ lời người xưa.",
    },
  },

  // 4. NÔN NÓNG - Signal 1
  {
    id: "non-nong-1",
    metadata: createDemoMetadata(),
    mood: "Nôn nóng",
    moodDesc: "Tâm trí hối hả, cần hạ nhịp thở và chậm lại từng giây",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Nước chảy đá mòn ngàn năm tích",
      line2: "Chậm rãi gieo mùa gặt bội thu.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },
    research: {
      title: "VÙNG 2 • TƯ LIỆU THAM KHẢO & KHẢO CỨU",
      source: "Nội dung biên soạn minh họa",
      region: "Không gian văn hóa truyền thống Việt Nam",
      note: "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "nôn nóng",
      content:
        "Cơn nôn nóng thường sinh ra khi ta mong muốn kết quả xuất hiện trước khi nhân duyên chín muồi. Cây cổ thụ trăm năm không thể lớn nhanh trong một buổi sớm mai. Hãy hạ nhịp bước, kiên nhẫn bồi đắp từng hành động nhỏ nhất, quả ngọt tự khắc thành tựu.",
      advice: "Gợi ý tiếp nhận: Đứng dậy, đi bộ 10 bước thật chậm rãi",
      signalNumber: "Chiêm nghiệm số #4521",
    },
    action: {
      title: "Rửa tay thanh tẩy nhịp vội vã",
      duration: "1 PHÚT",
      description:
        "Mở vòi nước mát, để dòng nước chảy qua từng kẽ ngón tay, cảm nhận sự mát lành và buông bỏ sự căng thẳng đang tích tụ trên đôi vai.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Thủy & Đất Mẹ",
      image: "/images/mekong_nam_bo.jpg",
      caption: "Họa phẩm cảm hứng: Dòng sông muôn đời chở nặng êm đềm",
    },
    loadingFacts: {
      breathingText: "Thong thả nhả ra từng đợt hơi ấm...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Dục tốc bất đạt, mưa dầm thấm lâu mầm xanh tươi tốt.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Làm mát tâm hỏa, điều hòa khí tức...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN DỊU MÁT",
      message:
        "Nắng gắt mau tàn, dòng suối mát bền bỉ tuôn trào. Hạ nhiệt âu lo để đón nhận một chỉ dẫn an lành.",
    },
  },
  // 4. NÔN NÓNG - Signal 2
  {
    id: "non-nong-2",
    metadata: createDemoMetadata(),
    mood: "Nôn nóng",
    moodDesc: "Tâm trí hối hả, cần hạ nhịp thở và chậm lại từng giây",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Ủ men rượu nếp chờ trăng sáng",
      line2: "Nước đủ hương nồng dạ mới say.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },
    research: {
      title: "VÙNG 2 • TƯ LIỆU THAM KHẢO & KHẢO CỨU",
      source: "Nội dung biên soạn minh họa",
      region: "Không gian văn hóa truyền thống Việt Nam",
      note: "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "nôn nóng",
      content:
        "Men rượu cần thời gian ủ kín trong chum sành mới dậy mùi thơm nức. Đốt cháy giai đoạn chỉ làm hỏng cả mẻ ủ quý. Sự việc bạn đang chờ đợi cũng vậy, hãy tin tưởng vào quy luật thời gian của đất trời.",
      advice: "Gợi ý tiếp nhận: Hít sâu 4 nhịp, thở ra 6 nhịp thật chậm",
      signalNumber: "Chiêm nghiệm số #4522",
    },
    action: {
      title: "Thả lỏng khớp vai và hàm",
      duration: "2 PHÚT",
      description:
        "Nhận diện xem quai hàm có đang nghiến chặt không, vai có đang co rút không. Thả lỏng cơ hàm, xoay nhẹ khớp vai 5 vòng theo chiều kim đồng hồ.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Gốm & Men",
      image: "/images/pottery_artisan.jpg",
      caption: "Họa phẩm cảm hứng: Chum sành ủ men thời gian mộc mạc",
    },
    loadingFacts: {
      breathingText: "Hạ nhịp, buông lỏng toàn thân...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Ủ kỹ men nồng, thơm ngát ngàn thu.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Chờ đợi cũng là một dạng tu dưỡng bản lĩnh...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN KIÊN ĐỊNH",
      message:
        "Chậm lại một nhịp để đi xa vạn dặm. Nhận lấy lời nhắn lành giúp lòng bạn dịu lại.",
    },
  },

  // 5. BIẾT ƠN - Signal 1
  {
    id: "biet-on-1",
    metadata: {
      contentKind: "editorial",
      editorialStatus: "draft",
      quotationVerified: true,
      sources: [
        {
          id: "cadaome-an-qua-nho-ke-trong-cay",
          title: "Ăn quả nhớ kẻ trồng cây",
          authorOrOrganization: "Ca dao Mẹ — trang đăng tải",
          url: "https://cadao.me/an-qua-nho-ke-trong-cay/",
          locator: "Mục Dị bản",
          accessedOn: "2026-10-04",
        },
      ],
      editorialNote:
        "Hai dòng ca dao đã được đối chiếu với mục Dị bản trên trang nguồn. Lời chiêm nghiệm do sản phẩm biên soạn, chưa hoàn tất duyệt biên tập. Chưa xác định xuất xứ lịch sử hoặc vùng miền.",
    },
    mood: "Biết ơn",
    moodDesc: "Tràn đầy cảm kích với những duyên lành nhỏ bé quanh mình",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Ăn quả nhớ kẻ trồng cây",
      line2: "Ăn khoai nhớ kẻ cho dây mà trồng",
      subtext: "Ca dao • Dị bản đăng trên Ca dao Mẹ",
    },
    research: {
      title: "Nguồn và ghi chú nội dung",
      source: "Ca dao Mẹ — mục Dị bản",
      region: "Chưa xác định vùng miền từ nguồn đang sử dụng.",
      note:
        "Nguồn dùng để đối chiếu câu chữ. Phần chiêm nghiệm bên dưới là lời biên soạn của sản phẩm.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "biết ơn",
      content:
        "Cặp câu này gợi một cách nhìn về lòng biết ơn: khi nhận được điều tốt đẹp, ta có thể nhớ đến những người đã góp phần tạo nên điều ấy. Bạn thử nghĩ về một sự giúp đỡ nhỏ gần đây và người đã dành điều đó cho mình.",
      advice:
        "Gợi ý tiếp nhận: Nếu thấy phù hợp, gửi một lời cảm ơn cụ thể tới người đã giúp bạn.",
      signalNumber: "Chiêm nghiệm số #7789",
    },
    action: {
      title: "Gửi tin nhắn tri ân thân tình",
      duration: "2 PHÚT",
      description:
        "Chọn một người đã từng giúp đỡ hoặc sẻ chia cùng bạn, gửi cho họ một câu hỏi thăm chân thành kèm lời cảm ơn giản dị.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Hương & Trầm",
      image: "/images/hue_trung_bo.jpg",
      caption: "Họa phẩm cảm hứng: Cội nguồn thiêng liêng hoa trái ngọt ngào",
    },
    loadingFacts: {
      breathingText: "Dành một nhịp để nhận biết điều đang có mặt...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Tâm biết ơn sinh hoa thơm cỏ lạ, lòng hoan hỷ đón nhận muôn phúc.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Dệt chữ tri ân trên từng nét mực mộc mạc...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN PHÚC LÀNH",
      message:
        "Khi lòng biết ơn tràn ngập, mọi bước chân đều trở thành điềm lành. Đón nhận hoa trái tâm hồn dịu êm.",
    },
  },
  // 5. BIẾT ƠN - Signal 2
  {
    id: "biet-on-2",
    metadata: createDemoMetadata(),
    mood: "Biết ơn",
    moodDesc: "Tràn đầy cảm kích với những duyên lành nhỏ bé quanh mình",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Gieo hạt mầm thơm vào đất ẩm",
      line2: "Cảm tạ trời mây giọt sương lành.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },
    research: {
      title: "VÙNG 2 • TƯ LIỆU THAM KHẢO & KHẢO CỨU",
      source: "Nội dung biên soạn minh họa",
      region: "Không gian văn hóa truyền thống Việt Nam",
      note: "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "biết ơn",
      content:
        "Một bữa cơm, một lời hỏi thăm hay sự giúp đỡ đúng lúc có thể trở thành điều đáng trân trọng. Bạn thử chọn một điều nhỏ hôm nay khiến mình biết ơn. Không cần ép bản thân phải cảm thấy tích cực nếu bạn đang có một ngày khó khăn.",
      advice: "Gợi ý tiếp nhận: Đặt tay lên trái tim thầm cảm ơn bản thân",
      signalNumber: "Chiêm nghiệm số #7790",
    },
    action: {
      title: "Tự cảm ơn chính cơ thể mình",
      duration: "1 PHÚT",
      description:
        "Đặt hai tay lên ngực áo, cảm nhận nhịp đập bền bỉ không ngừng nghỉ của trái tim và thầm cảm ơn cơ thể đã kiên cường đồng hành cùng bạn suốt bao năm tháng.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Sen & Nước",
      image: "/images/tea_bowl.jpg",
      caption: "Họa phẩm cảm hứng: Chén trà thơm đượm tấm lòng thảo thơm",
    },
    loadingFacts: {
      breathingText: "Nhịp đập chân thành, tri ân vạn vật...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Thảo thơm ắt gặp người hiền, hạt lành nảy nở muôn duyên.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Gieo mầm bình an vào từng hơi thở...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN THẢO THƠM",
      message:
        "Biết ơn mở rộng dung lượng trái tim. Chúc cho tâm thức bạn luôn đong đầy niềm hân hoan an lành.",
    },
  },

  // 6. CẦN ĐIỂM TỰA - Signal 1
  {
    id: "can-diem-tua-1",
    metadata: createDemoMetadata(),
    mood: "Cần điểm tựa",
    moodDesc: "Mệt mỏi sau ngày dài, muốn được vỗ về trong khoảng lặng",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Núi cao tựa bóng che sương gió",
      line2: "Mẹ hiền ru giấc mộng bình yên.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },
    research: {
      title: "VÙNG 2 • TƯ LIỆU THAM KHẢO & KHẢO CỨU",
      source: "Nội dung biên soạn minh họa",
      region: "Không gian văn hóa truyền thống Việt Nam",
      note: "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "cần điểm tựa",
      content:
        "Thừa nhận mình đang mệt mỏi và cần điểm tựa chính là lòng dũng cảm. Bạn không cần phải luôn kiên cường trước mọi sóng gió. Hãy ngả lưng tựa vào chiếc ghế êm, uống một ngụm trà nóng và cảm nhận rằng tổ tiên cùng mái nhà an lành luôn dang tay che chở cho bạn.",
      advice: "Gợi ý tiếp nhận: Đặt hai tay ôm chéo đôi bờ vai của mình",
      signalNumber: "Chiêm nghiệm số #5920",
    },
    action: {
      title: "Tự ôm lấy chính mình trong im lặng",
      duration: "2 PHÚT",
      description:
        "Khoanh tay nhẹ nhàng ôm lấy đôi vai bạn, nhắm mắt lại và tự nhủ: 'Hôm nay mình đã làm rất tốt rồi, giờ là lúc nghỉ ngơi'.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Nến & Ấm Áp",
      image: "/images/tea_bowl.jpg",
      caption: "Họa phẩm cảm hứng: Chốn nương náu bình yên sau ngày dài",
    },
    loadingFacts: {
      breathingText: "Nương náu vào hơi thở an lành này...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Tâm cần chốn đỗ, lòng sẽ gặp bến bờ yêu thương rộng mở.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Thắp lên ngọn đèn ấm áp xua tan cô đơn...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN CHE CHỞ",
      message:
        "Tựa vào cội nguồn, buông bỏ muộn phiền. Hệ thống xin gửi đến bạn lời vỗ về ấm áp nhất hôm nay.",
    },
  },
  // 6. CẦN ĐIỂM TỰA - Signal 2
  {
    id: "can-diem-tua-2",
    metadata: createDemoMetadata(),
    mood: "Cần điểm tựa",
    moodDesc: "Mệt mỏi sau ngày dài, muốn được vỗ về trong khoảng lặng",
    badge: "BƯỚC 4 / 4 • CHIÊM NGHIỆM TRỌN VẸN",
    poem: {
      line1: "Mái hiên che chở giọt mưa sa",
      line2: "Bếp lửa nhà ai ấm mái nhà.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },
    research: {
      title: "VÙNG 2 • TƯ LIỆU THAM KHẢO & KHẢO CỨU",
      source: "Nội dung biên soạn minh họa",
      region: "Không gian văn hóa truyền thống Việt Nam",
      note: "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt.",
    },
    reflection: {
      title: "VÙNG 3 • Góc Nhìn Soi Tỏ Tâm Thức",
      highlightWord: "cần điểm tựa",
      content:
        "Khi thấy mệt, bạn có thể nghỉ ngơi hoặc tìm đến một người bạn tin cậy nếu điều đó phù hợp với mình.",
      advice: "Gợi ý tiếp nhận: Đắp một tấm chăn mỏng hoặc mặc thêm áo ấm",
      signalNumber: "Chiêm nghiệm số #5921",
    },
    action: {
      title: "Thả lỏng toàn thân trên ghế êm",
      duration: "3 PHÚT",
      description:
        "Tựa hoàn toàn lưng và đầu vào thành ghế hoặc gối mềm, buông thõng hai tay và để trọng lực nâng đỡ bạn hoàn toàn mà không cần gồng cứng.",
      buttonLabel: "Đánh dấu đã thực hiện hành động này ✓",
      tag: "VÙNG 4 • HÀNH ĐỘNG NUÔI TÂM",
    },
    artwork: {
      tag: "Bếp Lửa & Hiên Nhà",
      image: "/images/do_paper_still_life.jpg",
      caption: "Họa phẩm cảm hứng: Bếp lửa ấm cúng giữa ngày mưa gió",
    },
    loadingFacts: {
      breathingText: "Tựa vào chiếc gối êm, buông lỏng...",
      thoughtTitle: "TÂM NIỆM",
      thoughtContent: "Mái ấm cội nguồn che chở vạn gió sương.",
      originTitle: "GỢI NHẮC CỘI NGUỒN",
      originContent: "Nội dung biên soạn minh họa gợi nhắc nếp sống và triết lý dân gian.",
      stepText: "Nhen nhóm ngọn lửa bình an trong tim...",
    },
    guestPreview: {
      title: "MẠCH NGUỒN VỖ VỀ",
      message:
        "Bạn luôn được che chở bởi cội nguồn và tình yêu thương. Nhận lấy lời nhắn lành xoa dịu tâm can.",
    },
  },
];

type AddedMood =
  | "Áp lực"
  | "Cô đơn"
  | "Vui vẻ"
  | "Mông lung";

const ADDED_MOOD_CONTENT: Record<
  AddedMood,
  {
    id: string;
    message: string;
    reflection: string;
    actionTitle: string;
    actionDescription: string;
  }
> = {
  "Áp lực": {
    id: "mood-ap-luc-01",
    message: "Bạn không cần giải quyết mọi việc trong cùng một lúc.",
    reflection:
      "Khi nhiều việc cùng đòi hỏi sự chú ý, cảm giác quá tải có thể xuất hiện. Bạn thử phân biệt việc thật sự cần làm hôm nay với việc có thể chờ hoặc cần thêm sự hỗ trợ.",
    actionTitle: "Chọn một việc vừa sức",
    actionDescription:
      "Viết ra một việc có thể làm trong vài phút. Nếu phù hợp, chọn thêm một việc có thể hoãn hoặc nhờ người khác hỗ trợ.",
  },

  "Cô đơn": {
    id: "mood-co-don-01",
    message: "Mong muốn được lắng nghe của bạn đáng được trân trọng.",
    reflection:
      "Bạn không cần ép mình phải vui lên ngay. Nếu muốn, hãy nghĩ đến một người hoặc một cộng đồng khiến bạn thấy thoải mái khi kết nối.",
    actionTitle: "Mở một kết nối nhỏ",
    actionDescription:
      "Bạn có thể gửi một lời hỏi thăm đến người mình tin tưởng. Nếu chưa muốn trò chuyện, hãy viết điều bạn muốn được người khác hiểu.",
  },

  "Vui vẻ": {
    id: "mood-vui-ve-01",
    message: "Bạn có thể dành một chút thời gian để tận hưởng niềm vui này.",
    reflection:
      "Niềm vui không cần phải lớn mới đáng ghi nhớ. Bạn thử nhận ra điều đã làm ngày hôm nay dễ chịu hơn và cách mình muốn giữ lại khoảnh khắc ấy.",
    actionTitle: "Ghi lại một điều vui",
    actionDescription:
      "Viết một câu về điều khiến bạn vui hôm nay. Nếu muốn, chia sẻ niềm vui đó với một người thân quen.",
  },

  "Mông lung": {
    id: "mood-mong-lung-01",
    message: "Chưa rõ toàn bộ con đường cũng không ngăn bạn tìm một bước nhỏ.",
    reflection:
      "Bạn có thể chưa có đủ thông tin để quyết định. Thay vì buộc mình chọn ngay, hãy nhận diện điều còn chưa rõ và một cách tìm hiểu thêm.",
    actionTitle: "Làm rõ một câu hỏi",
    actionDescription:
      "Viết một câu hỏi bạn đang băn khoăn. Chọn một thông tin cần tìm hoặc một người có thể giúp bạn hiểu thêm.",
  },
};

for (const [mood, content] of Object.entries(
  ADDED_MOOD_CONTENT
) as [AddedMood, (typeof ADDED_MOOD_CONTENT)[AddedMood]][]) {
  const signal: SignalData = {
    id: content.id,
    metadata: createDemoMetadata(),
    mood,
    moodDesc:
      MOODS_LIST.find((item) => item.key === mood)?.desc ?? mood,
    badge: "Lời gợi mở",

    poem: {
      line1: content.message,
      line2: "Bạn có thể chọn điều phù hợp với mình.",
      subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
    },

    research: {
      title: "Về lời gợi mở này",
      source: "Tin Lâm Tâm Linh",
      region:
        mood === "Áp lực"
          ? "Không gian chánh niệm"
          : mood === "Vui vẻ"
            ? "Sông nước Nam Bộ"
            : mood === "Mông lung"
              ? "Cố đô Huế"
              : "Khoảng lặng tĩnh tại",
      note: "Nội dung gợi ý chiêm nghiệm hướng đến sự an tâm.",
    },

    reflection: {
      title: "Một góc nhìn cho bạn",
      highlightWord: mood,
      content: content.reflection,
      advice: content.message,
      signalNumber: `Chiêm nghiệm · ${mood}`,
    },

    action: {
      title: content.actionTitle,
      duration: "Khoảng 2 phút",
      description: content.actionDescription,
      buttonLabel: "Tôi đã thực hiện",
      tag: "Tự nguyện",
    },

    artwork:
      mood === "Áp lực"
        ? {
            tag: "Khoảng lặng tĩnh tại",
            image: "/images/zen_meditation.jpg",
            caption: "Ngồi yên thở nhẹ — Buông bớt nhọc nhằn",
          }
        : mood === "Vui vẻ"
          ? {
              tag: "Khởi sắc hân hoan",
              image: "/images/mekong_nam_bo.jpg",
              caption: "Nắng ấm phù sa — Đón nhận niềm hoan hỷ",
            }
          : mood === "Mông lung"
            ? {
                tag: "Bình tâm sáng tỏ",
                image: "/images/hue_trung_bo.jpg",
                caption: "Sương giăng trầm mặc — Đợi nắng tỏ lối đi",
              }
            : {
                tag: "Vỗ về khoảng lặng",
                image: "/images/tea_bowl.jpg",
                caption: "Một khoảng riêng dịu dàng với chính mình",
              },

    loadingFacts: {
      breathingText: "Bạn có thể dừng lại một chút nếu muốn.",
      thoughtTitle: "Một lời gợi mở",
      thoughtContent: content.message,
      originTitle: "Nội dung của bản thử nghiệm",
      originContent:
        "Lời biên soạn theo cảm xúc bạn chọn; chưa phân tích nội dung nhật ký.",
      stepText: "Mở lời chiêm nghiệm",
    },

    guestPreview: {
      title: "Một khoảng dành cho bạn",
      message: content.message,
    },
  };

  ALL_SIGNALS.push(signal);
}

const CONTEXT_CONTENT: Record<
  Exclude<MoodContextKey, "general">,
  {
    label: string;
    poemLine1: string;
    poemLine2: string;
    message: string;
    reflection: string;
    actionTitle: string;
    actionDescription: string;
  }
> = {
  study: {
    label: "Học tập",
    poemLine1: "Đường học vạn dặm, khởi từ một trang sách nhỏ.",
    poemLine2: "Tâm trí an định, chọn lấy điều vừa sức hôm nay.",
    message:
      "Đường học vạn dặm, khởi từ một trang sách nhỏ. Tâm trí an định, chọn lấy điều vừa sức hôm nay.",
    reflection:
      "Hãy nhìn vào điều bạn đang cần học thay vì buộc mình giải quyết mọi thứ ngay. Một câu hỏi rõ ràng hoặc một lần luyện tập vừa sức cũng là một bước tiến đáng quý.",
    actionTitle: "Chọn một phần cần làm rõ",
    actionDescription:
      "Ghi một câu hỏi hoặc một phần bài bạn muốn hiểu thêm. Đọc lại tài liệu, thử một ví dụ nhỏ hoặc trao đổi cùng người đồng hành.",
  },

  work: {
    label: "Công việc",
    poemLine1: "Việc trước mắt dẫu nhiều, khởi từ bước rõ ràng.",
    poemLine2: "Giữ lòng kiên định, hanh thông tự khắc tới.",
    message:
      "Việc trước mắt dẫu nhiều, bắt đầu từ một bước rõ ràng sẽ thấy hanh thông.",
    reflection:
      "Phân biệt điều mình có thể chủ động với điều cần thêm thông tin hoặc sự trợ lực. Không cần vội vã quyết định khi lòng chưa an.",
    actionTitle: "Làm rõ bước tiếp theo",
    actionDescription:
      "Chọn một việc cụ thể, xác định kết quả muốn đạt và điều còn thiếu để bắt đầu. Trao đổi thêm với người hỗ trợ nếu cần.",
  },

  family: {
    label: "Gia đình",
    poemLine1: "Lắng nghe chân thành, ấm áp một lời thăm hỏi.",
    poemLine2: "Nếp nhà thuận hòa, khởi từ sự cảm thông.",
    message:
      "Lắng nghe chân thành, một lời thăm hỏi ấm áp mở ra bao thuận hòa.",
    reflection:
      "Mỗi gia đình có những câu chuyện riêng. Một ánh nhìn thấu cảm, một khoảng thời gian sẻ chia hay đơn giản là giữ lòng bình lặng đều là món quà quý.",
    actionTitle: "Chọn một điều muốn nói",
    actionDescription:
      "Viết một lời hỏi thăm, một điều biết ơn hoặc một lời giãi bày chân thành. Bạn có thể giữ riêng hoặc chia sẻ khi thấy phù hợp.",
  },

  relationship: {
    label: "Tình cảm",
    poemLine1: "Thấu hiểu lòng mình trước khi hiểu đối phương.",
    poemLine2: "Tâm an tĩnh tại, nhân duyên tự sáng rõ.",
    message:
      "Thấu hiểu chính mình trước khi thấu hiểu đối phương, nhân duyên tự khắc sáng rõ.",
    reflection:
      "Cảm xúc của bạn luôn đáng được trân trọng. Phân biệt rõ điều mình đã biết với những hoài nghi suy đoán, từ tốn lắng nghe và đón nhận điều chân thành.",
    actionTitle: "Viết một điều bạn cần",
    actionDescription:
      "Ghi lại một cảm xúc, một nhu cầu và một giới hạn bạn muốn được tôn trọng. Bạn có thể giữ riêng hoặc chia sẻ khi sẵn sàng.",
  },
};

const MOOD_GUIDANCE: Record<
  MoodKey,
  {
    opening: string;
    question: string;
    smallStep: string;
  }
> = {
  "Chênh vênh": {
    opening:
      "Khi chưa thấy một điểm tựa rõ ràng, bạn có thể bắt đầu từ điều mình biết chắc trong hiện tại.",
    question:
      "Điều gì đang giúp bạn cảm thấy vững hơn, dù chỉ một chút?",
    smallStep:
      "Ghi lại một điều đang nâng đỡ bạn và một bước nhỏ bạn có thể chủ động.",
  },

  "An yên": {
    opening:
      "Khoảng bình yên này có thể giúp bạn nhận ra điều đang phù hợp với mình.",
    question:
      "Bạn muốn giữ lại thói quen hoặc điều kiện nào đang tạo nên sự dễ chịu?",
    smallStep:
      "Chọn một điều đang có ích và nghĩ cách dành chỗ cho nó trong những ngày tới.",
  },

  "Băn khoăn": {
    opening:
      "Khi đứng trước nhiều lựa chọn, bạn không cần buộc mình có câu trả lời ngay.",
    question:
      "Bạn còn thiếu thông tin gì để hiểu rõ các lựa chọn?",
    smallStep:
      "Viết một điều đã biết và một câu hỏi cần làm rõ trước khi quyết định.",
  },

  "Nôn nóng": {
    opening:
      "Mong muốn tiến nhanh có thể khiến khoảng chờ trở nên khó chịu. Bạn thử nhìn vào phần việc mình có thể làm trước.",
    question:
      "Điều gì nằm trong khả năng chủ động của bạn lúc này?",
    smallStep:
      "Chọn một việc vừa sức để làm trong hôm nay, thay vì kiểm tra kết quả liên tục.",
  },

  "Biết ơn": {
    opening:
      "Bạn có thể dành một khoảng nhỏ để gọi tên điều đang khiến mình thấy biết ơn.",
    question:
      "Có người, hành động hoặc khoảnh khắc nào bạn muốn ghi nhớ?",
    smallStep:
      "Viết một lời cảm ơn cụ thể. Bạn có thể giữ riêng hoặc gửi đi nếu muốn.",
  },

  "Cần điểm tựa": {
    opening:
      "Bạn không nhất thiết phải tự gánh mọi việc. Tìm sự hỗ trợ cũng là một cách chăm sóc mình.",
    question:
      "Bạn cần được lắng nghe, hỗ trợ việc cụ thể hay có thêm thời gian?",
    smallStep:
      "Gọi tên một nhu cầu và một người hoặc nguồn hỗ trợ mà bạn thấy thoải mái tìm đến.",
  },

  "Áp lực": {
    opening:
      "Khi nhiều việc cùng đòi hỏi sự chú ý, bạn có thể thu nhỏ phần việc cần giải quyết trước mắt.",
    question:
      "Việc nào cần làm trước, việc nào có thể chờ hoặc nhờ hỗ trợ?",
    smallStep:
      "Chọn một việc ưu tiên và một việc có thể tạm để sang lúc khác.",
  },

  "Cô đơn": {
    opening:
      "Cảm giác cô đơn không buộc bạn phải vội tìm một mối quan hệ. Bạn có thể chọn một cách kết nối khiến mình thấy an toàn và thoải mái.",
    question:
      "Bạn đang cần được trò chuyện, được hiểu hay có người cùng làm một việc nhỏ?",
    smallStep:
      "Nếu muốn, nhắn một lời hỏi thăm đến người bạn tin cậy; hoặc viết điều bạn muốn được lắng nghe.",
  },

  "Vui vẻ": {
    opening:
      "Bạn có thể tận hưởng niềm vui hiện tại mà không cần biến nó thành một mục tiêu mới.",
    question:
      "Điều gì làm bạn vui và bạn muốn ghi nhớ khoảnh khắc này như thế nào?",
    smallStep:
      "Ghi lại một chi tiết đáng nhớ hoặc chia sẻ niềm vui với người bạn muốn.",
  },

  "Mông lung": {
    opening:
      "Khi chưa rõ mình muốn đi đâu, việc nhận ra điều quan trọng với mình có thể là điểm bắt đầu.",
    question:
      "Điều gì bạn muốn tìm hiểu thêm trước khi chọn hướng tiếp theo?",
    smallStep:
      "Chọn một câu hỏi nhỏ để tìm hiểu, thay vì yêu cầu bản thân lập ngay một kế hoạch dài.",
  },
};

const CONTEXT_BASE_SIGNALS = MOODS_LIST.map((mood) =>
  ALL_SIGNALS.find((signal) => signal.mood === mood.key)
).filter((signal): signal is SignalData => Boolean(signal));

for (const base of CONTEXT_BASE_SIGNALS) {
  for (const contextKey of [
    "study",
    "work",
    "family",
    "relationship",
  ] as const) {
    const content = CONTEXT_CONTENT[contextKey];
    const guidance = MOOD_GUIDANCE[base.mood];

    ALL_SIGNALS.push({
      ...base,

      id: `${base.id}-context-${contextKey}`,
      contextKey,
      metadata: createDemoMetadata(),
      badge: `Lời gợi mở · ${content.label}`,

      poem: {
        line1: content.poemLine1,
        line2: content.poemLine2,
        subtext: "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an.",
      },

      artwork:
        contextKey === "study"
          ? {
              tag: "Bút Nghiên & Sách Cổ",
              image: "/images/relic_book.jpg",
              caption: "Sách cổ bút nghiên — Soi sáng từng bước đường học",
            }
          : contextKey === "work"
            ? {
                tag: "Gốm Mộc Nghệ Nhân",
                image: "/images/pottery_artisan.jpg",
                caption: "Đôi bàn tay tạo tác — Vững vàng kiên nhẫn từng chi tiết",
              }
            : contextKey === "family"
              ? {
                  tag: "Bếp Lửa Sum Vầy",
                  image: "/images/hero_family.jpg",
                  caption: "Minh họa chủ đề sum họp; không đại diện cho một hoàn cảnh cụ thể.",
                }
              : {
                  tag: "Duyên Lành Tao Ngộ",
                  image: "/images/chu_dong_tu.jpg",
                  caption: "Tiên Dung – Chử Đồng Tử: Duyên lành trân quý",
                },

      research: {
        title: "Về lời gợi mở này",
        source: "Tin Lâm Tâm Linh",
        region:
          contextKey === "study"
            ? "Truyền thống hiếu học Việt Nam"
            : contextKey === "work"
              ? "Làng nghề thủ công truyền thống"
              : contextKey === "family"
                ? "Nếp sống gia đình Việt"
                : "Truyền thuyết dân gian Việt Nam",
        note:
          "Nội dung dựa trên tâm trạng và hoàn cảnh bạn chọn, hướng đến sự an tâm.",
      },

      reflection: {
        title: `Một góc nhìn về ${content.label.toLowerCase()}`,
        highlightWord: base.mood,

        content: [
          guidance.opening,
          content.reflection,
          guidance.question,
        ].join("\n\n"),

        advice: guidance.smallStep,
        signalNumber: "Bản thử nghiệm",
      },

      action: {
        title: content.actionTitle,
        duration: "Khoảng 2 phút",

        description:
          guidance.smallStep +
          "\n\n" +
          `Nếu muốn hướng đến ${content.label.toLowerCase()}: ` +
          content.actionDescription,

        buttonLabel: "Tôi đã thực hiện",
        tag: "Tự nguyện",
      },

      loadingFacts: {
        breathingText:
          "Bạn có thể dừng lại một chút nếu muốn.",
        thoughtTitle: `Một lời gợi mở về ${content.label.toLowerCase()}`,
        thoughtContent: content.message,
        originTitle: "Theo lựa chọn của bạn",
        originContent:
          "Nội dung mẫu theo tâm trạng và hoàn cảnh; chưa phân tích nhật ký.",
        stepText: "Mở lời chiêm nghiệm",
      },

      guestPreview: {
        title: `Một khoảng dành cho ${content.label.toLowerCase()}`,
        message: content.message,
      },
    });
  }
}

// Helper methods
export function getSignalById(id: string): SignalData | undefined {
  return ALL_SIGNALS.find((s) => s.id === id);
}

export function getSignalsByMood(mood: MoodKey): SignalData[] {
  return ALL_SIGNALS.filter((s) => s.mood === mood);
}

export function getDefaultSignalForMood(mood: MoodKey): SignalData {
  const list = getSignalsByMood(mood);
  return list[0] || ALL_SIGNALS[0];
}

export function getSignalForMoodContext(
  mood: MoodKey,
  contextKey: MoodContextKey
): SignalData {
  if (contextKey === "general") {
    return getDefaultSignalForMood(mood);
  }

  return (
    ALL_SIGNALS.find(
      (signal) =>
        signal.mood === mood &&
        signal.contextKey === contextKey
    ) ?? getDefaultSignalForMood(mood)
  );
}

export function getNextSignalForMood(
  currentSignalId: string,
  mood: MoodKey
): SignalData {
  const current = getSignalById(currentSignalId);

  const list = getSignalsByMood(mood).filter(
    (signal) =>
      (signal.contextKey ?? "general") === (current?.contextKey ?? "general")
  );
  if (list.length <= 1) return list[0] || ALL_SIGNALS[0];
  const currentIndex = list.findIndex((s) => s.id === currentSignalId);
  const nextIndex = (currentIndex + 1) % list.length;
  return list[nextIndex];
}

// Backward compatibility map
export const SIGNALS_DATA: Record<MoodKey, SignalData> = {
  "Chênh vênh": getDefaultSignalForMood("Chênh vênh"),
  "An yên": getDefaultSignalForMood("An yên"),
  "Băn khoăn": getDefaultSignalForMood("Băn khoăn"),
  "Nôn nóng": getDefaultSignalForMood("Nôn nóng"),
  "Biết ơn": getDefaultSignalForMood("Biết ơn"),
  "Cần điểm tựa": getDefaultSignalForMood("Cần điểm tựa"),
  "Áp lực": getDefaultSignalForMood("Áp lực"),
  "Cô đơn": getDefaultSignalForMood("Cô đơn"),
  "Vui vẻ": getDefaultSignalForMood("Vui vẻ"),
  "Mông lung": getDefaultSignalForMood("Mông lung"),
};
