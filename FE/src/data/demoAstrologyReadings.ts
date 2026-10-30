export interface ReflectionFixture {
  id: string;
  title: string;
  theme: string;
  reflection: string[];
  practice: string;
}

export interface PalaceReflectionFixture extends ReflectionFixture {
  palaceId: string;
  symbol: string;
  commonTopics: string[];
}

export const DEMO_PALACE_REFLECTIONS: PalaceReflectionFixture[] = [
  { palaceId: "menh", id: "self", title: "Mệnh", symbol: "Biểu tượng về cách một người nhìn nhận bản thân và lựa chọn hướng đi.", commonTopics: ["Giá trị cá nhân", "Thói quen", "Điều muốn vun bồi"], theme: "Tự hiểu mình", reflection: ["Điều gì đang quan trọng với mình trong giai đoạn này?", "Thói quen nào giúp mình sống gần với giá trị đã chọn?"], practice: "Viết xuống ba giá trị muốn giữ trong tuần này." },
  { palaceId: "phu-mau", id: "parents", title: "Phụ Mẫu", symbol: "Gợi nhắc về sự chăm sóc, nguồn cội và những cuộc trò chuyện trong gia đình.", commonTopics: ["Lắng nghe", "Biết ơn", "Ranh giới lành mạnh"], theme: "Kết nối gia đình", reflection: ["Mình muốn nói lời cảm ơn nào với người thân?", "Có điều gì cần được trao đổi bình tĩnh và rõ ràng?"], practice: "Chọn một cách hỏi thăm người thân phù hợp với hoàn cảnh của mình." },
  { palaceId: "phuc-duc", id: "fortune", title: "Phúc Đức", symbol: "Một hình ảnh để suy ngẫm về sự nâng đỡ, cộng đồng và điều tốt được tiếp nối.", commonTopics: ["Cộng đồng", "Nếp nhà", "Lòng biết ơn"], theme: "Điều nâng đỡ mình", reflection: ["Ai hoặc điều gì đã giúp mình vượt qua một việc khó?", "Mình có thể tiếp nối một điều tử tế nào?"], practice: "Ghi lại một sự hỗ trợ mình đã nhận trong tháng này." },
  { palaceId: "dien-trach", id: "home", title: "Điền Trạch", symbol: "Gợi mở suy ngẫm về không gian sống và cảm giác an ổn.", commonTopics: ["Nếp sinh hoạt", "Không gian", "Sự an toàn"], theme: "Không gian sống", reflection: ["Góc nào trong nhà giúp mình nghỉ ngơi tốt hơn?", "Một thay đổi nhỏ nào giúp không gian dễ chịu?"], practice: "Dành mười phút sắp xếp một góc thường dùng." },
  { palaceId: "quan-loc", id: "work", title: "Quan Lộc", symbol: "Một biểu tượng để xem lại việc học, công việc và cách sử dụng năng lực.", commonTopics: ["Kỹ năng", "Mục tiêu", "Nhịp làm việc"], theme: "Công việc và học tập", reflection: ["Việc nào xứng đáng nhận sự tập trung của mình?", "Kỹ năng nào mình muốn rèn thêm trong tháng tới?"], practice: "Chia một mục tiêu lớn thành một bước có thể làm trong hôm nay." },
  { palaceId: "no-boc", id: "friends", title: "Nô Bộc", symbol: "Gợi nhắc về hợp tác, bạn bè và cách xây dựng sự tin cậy.", commonTopics: ["Bạn bè", "Hợp tác", "Giao tiếp"], theme: "Quan hệ và cộng tác", reflection: ["Mối quan hệ nào đang giúp hai bên cùng phát triển?", "Mình cần nói rõ mong đợi nào khi hợp tác?"], practice: "Gửi một lời ghi nhận cụ thể đến người đã hỗ trợ mình." },
  { palaceId: "thien-di", id: "travel", title: "Thiên Di", symbol: "Một góc nhìn về những môi trường mới và cách mình thích nghi.", commonTopics: ["Trải nghiệm mới", "Thích nghi", "Cộng đồng"], theme: "Mở rộng trải nghiệm", reflection: ["Môi trường nào khiến mình tò mò muốn tìm hiểu?", "Điều gì giúp mình cảm thấy vững vàng khi thay đổi?"], practice: "Tìm hiểu một địa điểm hoặc hoạt động văn hóa mới." },
  { palaceId: "tat-ach", id: "wellbeing", title: "Tật Ách", symbol: "Nhắc mình chú ý đến nhịp nghỉ ngơi và chăm sóc bản thân một cách thực tế.", commonTopics: ["Nghỉ ngơi", "Cân bằng", "Tìm hỗ trợ"], theme: "Chăm sóc bản thân", reflection: ["Cơ thể đang cần nghỉ ngơi hoặc hỗ trợ điều gì?", "Việc nào mình có thể tạm hoãn để giảm quá tải?"], practice: "Chọn một khoảng nghỉ ngắn và rời mắt khỏi màn hình." },
  { palaceId: "tai-bach", id: "resources", title: "Tài Bạch", symbol: "Một dịp nhìn lại nguồn lực, thói quen chi tiêu và kế hoạch thực tế.", commonTopics: ["Ngân sách", "Ưu tiên", "Nguồn lực"], theme: "Quản lý nguồn lực", reflection: ["Khoản chi nào phản ánh đúng ưu tiên của mình?", "Mình muốn tìm hiểu thêm thông tin gì trước một quyết định tài chính?"], practice: "Ghi lại các khoản chi thiết yếu trong một tuần." },
  { palaceId: "tu-tuc", id: "creativity", title: "Tử Tức", symbol: "Có thể xem như biểu tượng của sự chăm sóc, sáng tạo và điều mình nuôi dưỡng.", commonTopics: ["Sáng tạo", "Chăm sóc", "Điều để lại"], theme: "Sáng tạo và nuôi dưỡng", reflection: ["Ý tưởng nào mình muốn dành thời gian chăm chút?", "Mình muốn để lại ảnh hưởng tích cực nào qua việc mình làm?"], practice: "Dành một khoảng ngắn để bắt đầu ý tưởng đang trì hoãn." },
  { palaceId: "phu-the", id: "partnership", title: "Phu Thê", symbol: "Gợi mở về sự tôn trọng, giao tiếp và đồng hành trong các mối quan hệ.", commonTopics: ["Lắng nghe", "Tôn trọng", "Thỏa thuận"], theme: "Đồng hành", reflection: ["Mình đang lắng nghe nhu cầu của người khác như thế nào?", "Ranh giới hoặc thỏa thuận nào cần được trao đổi rõ?"], practice: "Dùng một câu hỏi mở để hiểu thêm góc nhìn của người đối thoại." },
  { palaceId: "huynh-de", id: "siblings", title: "Huynh Đệ", symbol: "Một hình ảnh về sự sẻ chia, tình thân và mạng lưới gần gũi.", commonTopics: ["Chia sẻ", "Tương trợ", "Khác biệt"], theme: "Sự sẻ chia", reflection: ["Mình có thể đề nghị hoặc trao sự hỗ trợ nào?", "Làm sao giữ sự tôn trọng khi mỗi người có một lựa chọn?"], practice: "Chủ động hỏi một người thân hoặc bạn bè xem họ cần gì." },
];

export const DEMO_DASHA_FIXTURES: ReflectionFixture[] = [
  { id: "dasha-1", title: "Chặng một", theme: "Tạo nền", reflection: ["Điều căn bản nào giúp mình cảm thấy ổn định?", "Mình đang học được gì từ những việc nhỏ lặp lại?"], practice: "Chọn một thói quen nền tảng để duy trì trong tháng." },
  { id: "dasha-2", title: "Chặng hai", theme: "Khám phá năng lực", reflection: ["Việc nào làm mình muốn học sâu hơn?", "Mình có thể thử nghiệm điều gì với rủi ro thấp?"], practice: "Thử một hoạt động mới và ghi lại điều đã học." },
  { id: "dasha-3", title: "Chặng ba", theme: "Xây dựng kết nối", reflection: ["Mối quan hệ nào cần thêm sự quan tâm?", "Mình có thể hợp tác dựa trên thế mạnh nào?"], practice: "Chủ động trao đổi với một người mình tin cậy." },
  { id: "dasha-4", title: "Chặng bốn", theme: "Điều chỉnh nhịp sống", reflection: ["Điều gì đang chiếm nhiều năng lượng hơn cần thiết?", "Mình muốn giữ lại khoảng trống nào cho bản thân?"], practice: "Xem lại lịch tuần và đặt một khoảng nghỉ." },
  { id: "dasha-5", title: "Chặng năm", theme: "Chia sẻ kinh nghiệm", reflection: ["Kinh nghiệm nào có thể hữu ích cho người khác?", "Mình muốn tiếp tục học từ ai?"], practice: "Viết lại một bài học đã giúp mình trưởng thành." },
  { id: "dasha-6", title: "Chặng sáu", theme: "Nhìn lại và làm mới", reflection: ["Điều gì đáng được tiếp tục?", "Mình muốn bắt đầu lại từ đâu với hiểu biết hiện tại?"], practice: "Chọn một việc cũ cần khép lại và một việc mới muốn thử." },
];

export const DEMO_MINOR_YEAR_FIXTURES: ReflectionFixture[] = [
  { id: "year-1", title: "Năm mẫu một", theme: "Sắp xếp ưu tiên", reflection: ["Việc nào cần hoàn thành trước?", "Mình có thể nhờ ai góp ý?"], practice: "Ghi ba ưu tiên cho quý tới." },
  { id: "year-2", title: "Năm mẫu hai", theme: "Học thêm điều mới", reflection: ["Kỹ năng nào hữu ích cho mục tiêu đang có?", "Nguồn học đáng tin cậy nào phù hợp?"], practice: "Đặt lịch một buổi học ngắn." },
  { id: "year-3", title: "Năm mẫu ba", theme: "Làm việc có nhịp", reflection: ["Cách làm nào giúp mình bớt phân tán?", "Việc gì có thể chia sẻ hoặc ủy thác?"], practice: "Thử một khoảng làm việc tập trung và nghỉ ngắn." },
  { id: "year-4", title: "Năm mẫu bốn", theme: "Nuôi dưỡng kết nối", reflection: ["Ai cần một cuộc trò chuyện chân thành?", "Mình đang cần đặt ranh giới nào?"], practice: "Chủ động dành thời gian cho một mối quan hệ quan trọng." },
  { id: "year-5", title: "Năm mẫu năm", theme: "Chăm sóc cân bằng", reflection: ["Dấu hiệu quá tải nào mình thường bỏ qua?", "Hỗ trợ phù hợp nào mình có thể tìm?"], practice: "Chọn một hoạt động nghỉ ngơi phù hợp; tìm chuyên gia khi cần tư vấn sức khỏe." },
  { id: "year-6", title: "Năm mẫu sáu", theme: "Quản lý nguồn lực", reflection: ["Nguồn lực nào nên dành cho mục tiêu chính?", "Thông tin nào mình cần kiểm tra trước khi quyết định?"], practice: "Rà soát ngân sách cá nhân theo khả năng của mình." },
  { id: "year-7", title: "Năm mẫu bảy", theme: "Mở rộng trải nghiệm", reflection: ["Mình tò mò về lĩnh vực nào?", "Bước thử nhỏ nhất là gì?"], practice: "Tìm hiểu một trải nghiệm mới bằng nguồn đáng tin." },
  { id: "year-8", title: "Năm mẫu tám", theme: "Củng cố điều đang làm", reflection: ["Điều gì đang tiến triển tốt?", "Có dữ kiện nào cần xem lại?"], practice: "Ghi nhận một tiến bộ cụ thể của bản thân." },
  { id: "year-9", title: "Năm mẫu chín", theme: "Chia sẻ và cộng tác", reflection: ["Mình có thể đóng góp điều gì cho tập thể?", "Việc hợp tác cần thỏa thuận nào rõ hơn?"], practice: "Trao đổi kỳ vọng trước khi bắt đầu một việc chung." },
  { id: "year-10", title: "Năm mẫu mười", theme: "Tổng kết và lựa chọn", reflection: ["Điều gì muốn tiếp tục trong năm sau?", "Điều gì có thể khép lại?"], practice: "Tổng kết bằng ba điều đã học, không phán xét bản thân." },
];

export const DEMO_MONTH_FIXTURES: ReflectionFixture[] = [
  { id: "month-1", title: "Tháng một", theme: "Khởi động vừa sức", reflection: ["Việc nào muốn bắt đầu từ bước nhỏ?", "Mình có thể bỏ bớt điều gì?"], practice: "Chọn một việc quan trọng cho tuần đầu." },
  { id: "month-2", title: "Tháng hai", theme: "Giữ nhịp", reflection: ["Thói quen nào đang hữu ích?", "Nhịp nào cần được điều chỉnh?"], practice: "Đặt một lời nhắc nghỉ ngơi trong lịch." },
  { id: "month-3", title: "Tháng ba", theme: "Học hỏi", reflection: ["Mình muốn hỏi ai một câu?", "Nguồn nào giúp kiểm chứng điều đang học?"], practice: "Lưu một tài liệu hữu ích để đọc kỹ." },
  { id: "month-4", title: "Tháng tư", theme: "Kết nối", reflection: ["Cuộc trò chuyện nào đang cần sự chú tâm?", "Mình muốn thể hiện sự trân trọng ra sao?"], practice: "Dành thời gian lắng nghe mà không vội đưa lời khuyên." },
  { id: "month-5", title: "Tháng năm", theme: "Làm mới", reflection: ["Góc nhìn nào mình muốn thử?", "Việc nào có thể làm theo cách đơn giản hơn?"], practice: "Thử thay đổi một bước nhỏ trong quy trình thường ngày." },
  { id: "month-6", title: "Tháng sáu", theme: "Cân bằng", reflection: ["Nguồn năng lượng của mình đến từ đâu?", "Việc gì nên tạm nghỉ?"], practice: "Bố trí một buổi không thêm lịch hẹn nếu có thể." },
  { id: "month-7", title: "Tháng bảy", theme: "Ghi nhận", reflection: ["Tiến bộ nào mình thường xem là hiển nhiên?", "Ai đã hỗ trợ mình?"], practice: "Ghi một điều đáng trân trọng trong ngày." },
  { id: "month-8", title: "Tháng tám", theme: "Tập trung", reflection: ["Mục tiêu nào thực sự phù hợp lúc này?", "Yếu tố gây xao nhãng nào có thể giảm?"], practice: "Dành một khoảng thời gian cho một việc duy nhất." },
  { id: "month-9", title: "Tháng chín", theme: "Chủ động", reflection: ["Bước nào nằm trong khả năng kiểm soát?", "Mình cần hỏi thêm thông tin gì?"], practice: "Viết bước tiếp theo dưới dạng hành động cụ thể." },
  { id: "month-10", title: "Tháng mười", theme: "Chăm sóc", reflection: ["Mình cần hỗ trợ điều gì?", "Ranh giới nào giúp giữ sức?"], practice: "Chia sẻ nhu cầu với một người phù hợp." },
  { id: "month-11", title: "Tháng mười một", theme: "Hoàn thiện", reflection: ["Việc nào có thể hoàn thành với nguồn lực hiện có?", "Điều gì có thể để sang thời điểm khác?"], practice: "Chọn một việc để khép lại gọn gàng." },
  { id: "month-12", title: "Tháng mười hai", theme: "Nhìn lại", reflection: ["Mình đã học được điều gì?", "Điều gì muốn mang sang chặng tiếp?"], practice: "Tổng kết một điều biết ơn và một điều muốn làm mới." },
];

export const DEMO_DAY_FIXTURE: ReflectionFixture = {
  id: "day-generic", title: "Một ngày có chủ đích", theme: "Tập trung vào điều có thể làm hôm nay", reflection: ["Việc nào là ưu tiên thực tế của mình hôm nay?", "Mình có thể nghỉ ngắn vào lúc nào?"], practice: "Chọn một việc vừa sức, chia thành bước nhỏ và tự cho phép điều chỉnh kế hoạch.",
};

export const DEMO_THEME_FIXTURES: ReflectionFixture[] = [
  { id: "theme-self", title: "Bản thân và định hướng", theme: "Giá trị và lựa chọn", reflection: ["Điều gì khiến một lựa chọn trở nên có ý nghĩa với mình?", "Mình muốn xin thêm góc nhìn nào trước khi quyết định?"], practice: "Viết hai lựa chọn cùng ưu điểm, giới hạn và bước thử nhỏ." },
  { id: "theme-career", title: "Học tập, sự nghiệp", theme: "Năng lực và hướng học", reflection: ["Kỹ năng nào mình đã có thể dùng tốt hơn?", "Mình cần dữ kiện nào trước khi đặt mục tiêu mới?"], practice: "Chọn một kỹ năng và một nguồn học để thử trong tuần." },
  { id: "theme-relationships", title: "Tình cảm và các mối quan hệ", theme: "Giao tiếp tôn trọng", reflection: ["Mình muốn được lắng nghe điều gì?", "Mình có thể lắng nghe người khác mà vẫn giữ ranh giới ra sao?"], practice: "Nói một nhu cầu bằng câu bắt đầu với “Mình cần…”" },
  { id: "theme-family", title: "Gia đình", theme: "Quan tâm và khác biệt", reflection: ["Điều gì đang giúp gia đình kết nối?", "Khác biệt nào cần được tôn trọng thay vì giải quyết ngay?"], practice: "Tạo một khoảng trò chuyện không thiết bị nếu phù hợp." },
  { id: "theme-finance", title: "Tài chính cá nhân", theme: "Thông tin và ưu tiên", reflection: ["Ưu tiên nào hướng dẫn cách mình dùng tiền?", "Nguồn tư vấn đáng tin nào nên tham khảo?"], practice: "Rà soát chi tiêu theo dữ liệu thực tế; không đưa quyết định chỉ dựa trên nội dung demo." },
  { id: "theme-balance", title: "Cân bằng đời sống", theme: "Nhịp làm việc và nghỉ ngơi", reflection: ["Dấu hiệu nào cho thấy mình cần chậm lại?", "Việc gì có thể đơn giản hóa?"], practice: "Đặt một khoảng nghỉ và một hoạt động giúp phục hồi." },
];

export function getReflectionFixture(fixtures: ReflectionFixture[], id: string): ReflectionFixture | null {
  return fixtures.find((fixture) => fixture.id === id) ?? null;
}
