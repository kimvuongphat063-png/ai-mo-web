import type {
  ContentType,
  PublishingPlatform,
  PromptModel,
  VideoModel,
  AspectRatio,
  VisualStyle,
  PerformanceMode,
  VoiceGender,
  VoiceRegion,
  VoiceAge,
  VoiceRole,
  SpeakingSpeed,
  Emotion,
} from "./schema";

export interface PromptKichBanPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  scriptText: string;
  inputText?: string; // alias
  contentType: ContentType;
  visualStyle: VisualStyle;
  publishingPlatform: PublishingPlatform;
  videoModel: VideoModel;
  promptModel: PromptModel;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  performanceMode: PerformanceMode;
  characterDescription?: string;
  voiceLanguage?: string;
  pacing?: "slow" | "balanced" | "fast";
  seoEnabled?: boolean;
  cta?: string;
  additionalRequirements?: string;

  // Legacy compatibility fields
  voiceGender?: VoiceGender;
  voiceRegion?: VoiceRegion;
  voiceAge?: VoiceAge;
  voiceRole?: VoiceRole;
  speakingSpeed?: SpeakingSpeed;
  emotion?: Emotion;
  tone?: string;
  callToAction?: string;
}

export const UNIVERSAL_PRESETS: PromptKichBanPreset[] = [
  {
    id: "ecommerce-ugc",
    name: "Review sản phẩm & Unboxing",
    badge: "Bán chạy",
    description: "Mở hộp và trải nghiệm sản phẩm thực tế dạng UGC chân thật, cận cảnh chi tiết và tính năng thực tế.",
    scriptText:
      "Hôm nay mình vừa nhận được món đồ này, mở hộp ra nhìn thực sự bất ngờ về độ hoàn thiện. Cầm trên tay rất đầm, chất liệu cao cấp và cảm giác sử dụng cực kỳ mượt mà. Ai đang phân vân thì xem hết clip này để thấy chi tiết từng góc cạnh nhé!",
    inputText:
      "Hôm nay mình vừa nhận được món đồ này, mở hộp ra nhìn thực sự bất ngờ về độ hoàn thiện. Cầm trên tay rất đầm, chất liệu cao cấp và cảm giác sử dụng cực kỳ mượt mà. Ai đang phân vân thì xem hết clip này để thấy chi tiết từng góc cạnh nhé!",
    contentType: "review",
    visualStyle: "ugc",
    publishingPlatform: "tiktok",
    videoModel: "both",
    promptModel: "all",
    aspectRatio: "9:16",
    durationSeconds: 30,
    performanceMode: "hands-or-POV",
    pacing: "balanced",
    seoEnabled: true,
    cta: "Nhấn vào link bên dưới để xem thêm ưu đãi và đánh giá chi tiết nhé!",
    callToAction: "Nhấn vào link bên dưới để xem thêm ưu đãi và đánh giá chi tiết nhé!",
    additionalRequirements: "Góc quay cận cảnh bàn tay thao tác tự nhiên, ánh sáng studio mềm mại, màu sắc chân thực.",
    voiceGender: "neutral",
    voiceRegion: "south",
    voiceAge: "young",
    voiceRole: "reviewer",
    speakingSpeed: "normal",
    emotion: "friendly",
    tone: "Gần gũi, chân thật, như bạn bè tư vấn cho nhau",
  },
  {
    id: "beauty-cosmetics",
    name: "Mỹ phẩm & Chăm sóc da",
    badge: "Làm đẹp",
    description: "TVC mỹ phẩm sang trọng, giọt dưỡng chất sóng sánh, ánh sáng mềm mại và cận cảnh làn da căng bóng.",
    scriptText:
      "Bí quyết cho làn da luôn căng mọng và tràn đầy sức sống mỗi buổi sáng. Tinh chất thẩm thấu cực nhanh, dịu nhẹ và không hề gây bết dính. Chỉ vài giọt mỗi ngày để cảm nhận sự thay đổi rõ rệt trên làn da của bạn.",
    inputText:
      "Bí quyết cho làn da luôn căng mọng và tràn đầy sức sống mỗi buổi sáng. Tinh chất thẩm thấu cực nhanh, dịu nhẹ và không hề gây bết dính. Chỉ vài giọt mỗi ngày để cảm nhận sự thay đổi rõ rệt trên làn da của bạn.",
    contentType: "tvc",
    visualStyle: "luxury",
    publishingPlatform: "reels",
    videoModel: "both",
    promptModel: "all",
    aspectRatio: "9:16",
    durationSeconds: 30,
    performanceMode: "hands-or-POV",
    pacing: "slow",
    seoEnabled: false,
    cta: "Chăm sóc làn da ngay hôm nay cùng ưu đãi độc quyền trên giỏ hàng!",
    callToAction: "Chăm sóc làn da ngay hôm nay cùng ưu đãi độc quyền trên giỏ hàng!",
    additionalRequirements: "Ánh sáng beauty mềm, phản xạ lấp lánh trên chất lỏng chai serum, macro texture giọt nước.",
    voiceGender: "female",
    voiceRegion: "south",
    voiceAge: "young",
    voiceRole: "expert",
    speakingSpeed: "normal",
    emotion: "premium",
    tone: "Nhẹ nhàng, thanh lịch, tinh tế",
  },
  {
    id: "fnb-cafe-lifestyle",
    name: "Quán Cafe & Ẩm thực",
    badge: "F&B",
    description: "Không gian quán cafe thư giãn, làn khói ấm bốc lên từ ly cà phê, ánh nắng xiên qua khung cửa sổ.",
    scriptText:
      "Một góc nhỏ yên bình giữa lòng thành phố náo nhiệt. Tách cà phê ấm đậm vị, tiếng nhạc du dương và một buổi chiều chậm rãi để nạp lại năng lượng. Bạn đã tìm được chỗ trốn cho riêng mình tuần này chưa?",
    inputText:
      "Một góc nhỏ yên bình giữa lòng thành phố náo nhiệt. Tách cà phê ấm đậm vị, tiếng nhạc du dương và một buổi chiều chậm rãi để nạp lại năng lượng. Bạn đã tìm được chỗ trốn cho riêng mình tuần này chưa?",
    contentType: "storytelling",
    visualStyle: "lifestyle",
    publishingPlatform: "reels",
    videoModel: "both",
    promptModel: "all",
    aspectRatio: "9:16",
    durationSeconds: 30,
    performanceMode: "person-no-face-focus",
    pacing: "slow",
    seoEnabled: true,
    cta: "Lưu lại ngay địa chỉ này để rủ bạn thân ghé vào cuối tuần nhé!",
    callToAction: "Lưu lại ngay địa chỉ này để rủ bạn thân ghé vào cuối tuần nhé!",
    additionalRequirements: "Ánh nắng vàng hoàng hôn, hơi nước bốc lên từ ly latte, không gian ấm cúng.",
    voiceGender: "neutral",
    voiceRegion: "central",
    voiceAge: "young",
    voiceRole: "storyteller",
    speakingSpeed: "slow",
    emotion: "emotional",
    tone: "Trầm lắng, chữa lành, thư thái",
  },
  {
    id: "tech-tips-pov",
    name: "Mẹo công nghệ & Thủ thuật",
    badge: "Công nghệ",
    description: "Thao tác phím tắt, thủ thuật phần mềm hoặc mẹo sử dụng thiết bị với góc nhìn thứ nhất sắc nét.",
    scriptText:
      "3 tính năng cực kỳ hữu ích trên thiết bị này mà 90% người dùng chưa từng biết tới. Tính năng thứ nhất giúp bạn tiết kiệm nửa giờ làm việc mỗi ngày. Xem kỹ từng thao tác và lưu lại áp dụng ngay nhé!",
    inputText:
      "3 tính năng cực kỳ hữu ích trên thiết bị này mà 90% người dùng chưa từng biết tới. Tính năng thứ nhất giúp bạn tiết kiệm nửa giờ làm việc mỗi ngày. Xem kỹ từng thao tác và lưu lại áp dụng ngay nhé!",
    contentType: "tips",
    visualStyle: "tech-cinematic",
    publishingPlatform: "tiktok",
    videoModel: "both",
    promptModel: "all",
    aspectRatio: "9:16",
    durationSeconds: 45,
    performanceMode: "hands-or-POV",
    pacing: "fast",
    seoEnabled: true,
    cta: "Follow kênh để không bỏ lỡ những thủ thuật công nghệ thú vị tiếp theo!",
    callToAction: "Follow kênh để không bỏ lỡ những thủ thuật công nghệ thú vị tiếp theo!",
    additionalRequirements: "Cận cảnh màn hình sắc nét, thao tác ngón tay dứt khoát, nhịp điệu nhanh và bắt mắt.",
    voiceGender: "male",
    voiceRegion: "north",
    voiceAge: "young",
    voiceRole: "expert",
    speakingSpeed: "fast",
    emotion: "energetic",
    tone: "Rõ ràng, dứt khoát, chuyên nghiệp",
  },
  {
    id: "personal-branding",
    name: "Thương hiệu cá nhân & Storytelling",
    badge: "Creator",
    description: "Diễn thuyết trước ống kính, chia sẻ bài học kinh nghiệm sâu sắc, tạo dựng niềm tin và uy tín.",
    scriptText:
      "Sai lầm lớn nhất mà mình từng mắc phải khi mới bắt đầu hành trình này. Đừng chỉ tập trung vào sản phẩm, hãy lắng nghe khách hàng và giải quyết đúng nỗi đau của họ. Đây là 3 bài học đắt giá mình rút ra sau 3 năm khởi nghiệp.",
    inputText:
      "Sai lầm lớn nhất mà mình từng mắc phải khi mới bắt đầu hành trình này. Đừng chỉ tập trung vào sản phẩm, hãy lắng nghe khách hàng và giải quyết đúng nỗi đau của họ. Đây là 3 bài học đắt giá mình rút ra sau 3 năm khởi nghiệp.",
    contentType: "storytelling",
    visualStyle: "cinematic",
    publishingPlatform: "shorts",
    videoModel: "both",
    promptModel: "all",
    aspectRatio: "9:16",
    durationSeconds: 45,
    performanceMode: "presenter-on-camera",
    characterDescription: "Diễn giả trẻ tuổi ăn mặc lịch sự, phong thái tự tin và chân thành.",
    pacing: "balanced",
    seoEnabled: true,
    cta: "Bình luận suy nghĩ của bạn phía dưới để cùng trao đổi nhé!",
    callToAction: "Bình luận suy nghĩ của bạn phía dưới để cùng trao đổi nhé!",
    additionalRequirements: "Ống kính 50mm xóa phông mượt mà, ánh sáng studio tương phản nhẹ tạo chiều sâu gương mặt.",
    voiceGender: "male",
    voiceRegion: "north",
    voiceAge: "adult",
    voiceRole: "storyteller",
    speakingSpeed: "normal",
    emotion: "trustworthy",
    tone: "Chân thành, truyền cảm hứng, đĩnh đạc",
  },
  {
    id: "smart-home-clean",
    name: "Đồ gia dụng & Smart Home",
    badge: "Gia đình",
    description: "Thiết bị thông minh trong căn hộ tối giản, ánh sáng sạch sẽ, chuyển động cơ học mượt mà.",
    scriptText:
      "Căn nhà thông minh tự động dọn dẹp và bật đèn khi bạn trở về sau ngày dài làm việc. Không gian sạch bóng, tiện nghi và giải phóng hoàn toàn thời gian làm việc nhà cuối tuần cho bạn và gia đình.",
    inputText:
      "Căn nhà thông minh tự động dọn dẹp và bật đèn khi bạn trở về sau ngày dài làm việc. Không gian sạch bóng, tiện nghi và giải phóng hoàn toàn thời gian làm việc nhà cuối tuần cho bạn và gia đình.",
    contentType: "tvc",
    visualStyle: "clean-commercial",
    publishingPlatform: "facebook",
    videoModel: "both",
    promptModel: "all",
    aspectRatio: "16:9",
    durationSeconds: 30,
    performanceMode: "no-person",
    pacing: "balanced",
    seoEnabled: false,
    cta: "Nâng cấp không gian sống thông minh ngay hôm nay với ưu đãi lắp đặt miễn phí!",
    callToAction: "Nâng cấp không gian sống thông minh ngay hôm nay với ưu đãi lắp đặt miễn phí!",
    additionalRequirements: "Bối cảnh căn hộ hiện đại tối giản phong cách Bắc Âu, ánh sáng trắng ấm tự nhiên.",
    voiceGender: "female",
    voiceRegion: "south",
    voiceAge: "adult",
    voiceRole: "narrator",
    speakingSpeed: "normal",
    emotion: "friendly",
    tone: "Hiện đại, ấm áp, văn minh",
  },
  {
    id: "education-course",
    name: "Kiến thức & Khóa học",
    badge: "Giáo dục",
    description: "Truyền đạt kiến thức cô đọng, đồ họa minh họa sinh động, nhịp điệu rõ ràng và thuyết phục.",
    scriptText:
      "Quy luật 80/20 ứng dụng vào việc học tập và quản lý thời gian như thế nào? Chỉ 20% hành động cốt lõi tạo ra 80% kết quả vượt trội. Hãy tập trung vào những việc quan trọng nhất ngay từ hôm nay.",
    inputText:
      "Quy luật 80/20 ứng dụng vào việc học tập và quản lý thời gian như thế nào? Chỉ 20% hành động cốt lõi tạo ra 80% kết quả vượt trội. Hãy tập trung vào những việc quan trọng nhất ngay từ hôm nay.",
    contentType: "education",
    visualStyle: "educational",
    publishingPlatform: "youtube",
    videoModel: "both",
    promptModel: "all",
    aspectRatio: "16:9",
    durationSeconds: 60,
    performanceMode: "presenter-on-camera",
    characterDescription: "Giảng viên chia sẻ kiến thức với biểu cảm nhiệt tình, trang phục gọn gàng.",
    pacing: "balanced",
    seoEnabled: true,
    cta: "Đăng ký kênh để nhận thêm các bài học phát triển bản thân miễn phí mỗi tuần!",
    callToAction: "Đăng ký kênh để nhận thêm các bài học phát triển bản thân miễn phí mỗi tuần!",
    additionalRequirements: "Góc quay trung cảnh, bảng vẽ hoặc màn hình minh họa đồ thị, ánh sáng phòng thu sáng sủa.",
    voiceGender: "male",
    voiceRegion: "north",
    voiceAge: "adult",
    voiceRole: "expert",
    speakingSpeed: "normal",
    emotion: "trustworthy",
    tone: "Khoa học, dễ hiểu, thuyết phục",
  },
  {
    id: "real-estate-travel",
    name: "Bất động sản & Du lịch trải nghiệm",
    badge: "Trải nghiệm",
    description: "Góc quay toàn cảnh hùng vĩ, flycam lướt qua kiến trúc, ánh hoàng hôn rực rỡ và chiều sâu không gian.",
    scriptText:
      "Chào mừng bạn đến với căn biệt thự nghỉ dưỡng nép mình giữa thung lũng thông xanh ngát. Thiết kế mở đón trọn ánh sáng tự nhiên và view núi rừng tuyệt đẹp trong từng khoảnh khắc bình minh hay hoàng hôn.",
    inputText:
      "Chào mừng bạn đến với căn biệt thự nghỉ dưỡng nép mình giữa thung lũng thông xanh ngát. Thiết kế mở đón trọn ánh sáng tự nhiên và view núi rừng tuyệt đẹp trong từng khoảnh khắc bình minh hay hoàng hôn.",
    contentType: "storytelling",
    visualStyle: "documentary",
    publishingPlatform: "youtube",
    videoModel: "both",
    promptModel: "all",
    aspectRatio: "16:9",
    durationSeconds: 60,
    performanceMode: "no-person",
    pacing: "slow",
    seoEnabled: true,
    cta: "Liên hệ hotline hoặc để lại thông tin để nhận brochure chi tiết và đặt lịch trải nghiệm thực tế!",
    callToAction: "Liên hệ hotline hoặc để lại thông tin để nhận brochure chi tiết và đặt lịch trải nghiệm thực tế!",
    additionalRequirements: "Góc quay flycam rộng, chuyển động mượt mà, ánh sáng bình minh vàng óng, độ chi tiết 4K.",
    voiceGender: "neutral",
    voiceRegion: "south",
    voiceAge: "mature",
    voiceRole: "narrator",
    speakingSpeed: "slow",
    emotion: "premium",
    tone: "Sang trọng, gợi mở, điện ảnh",
  },
];

// Backward compatibility alias for any existing files
export const ANH_TAO_PRESETS = UNIVERSAL_PRESETS;
