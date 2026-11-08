import type { WordItem } from '../types';

export type PartOfSpeech = 
  | 'noun' 
  | 'verb' 
  | 'adjective' 
  | 'adverb' 
  | 'preposition' 
  | 'pronoun' 
  | 'determiner';

export interface SentenceItem {
  id: number;
  sentenceEn: string;
  sentenceVi: string;
  partOfSpeech: PartOfSpeech;
  level: 1 | 2 | 3;
}

interface PatternTemplate {
  id: number;
  templateEn: string;
  templateVi: string;
  pos: PartOfSpeech;
  level: 1 | 2 | 3; // 1: 6-8y (Pre-A1/A1), 2: 9-11y (A1/A2), 3: 12-15y (A2/B1)
  type: 'affirmative' | 'negative' | 'question' | 'complex';
}

export const COMPREHENSIVE_TEMPLATES: PatternTemplate[] = [
  // ==========================================
  // 1. DANH TỪ (NOUNS) - 35 TEMPLATES
  // ==========================================
  // Level 1: Starter (0-2 stars)
  { id: 101, templateEn: "This is a {word}.", templateVi: "Đây là một {meaning}.", pos: 'noun', level: 1, type: 'affirmative' },
  { id: 102, templateEn: "I have a {word} in my bag.", templateVi: "Tôi có một {meaning} ở trong cặp.", pos: 'noun', level: 1, type: 'affirmative' },
  { id: 103, templateEn: "I like my {word} very much.", templateVi: "Tôi rất thích {meaning} của mình.", pos: 'noun', level: 1, type: 'affirmative' },
  { id: 104, templateEn: "Do you see that {word}?", templateVi: "Bạn có nhìn thấy {meaning} kia không?", pos: 'noun', level: 1, type: 'question' },
  { id: 105, templateEn: "Look at the cute {word}.", templateVi: "Hãy nhìn vào {meaning} đáng yêu kìa.", pos: 'noun', level: 1, type: 'affirmative' },
  { id: 106, templateEn: "Where is my {word} now?", templateVi: "{meaningCapitalized} của tôi đang ở đâu?", pos: 'noun', level: 1, type: 'question' },
  { id: 107, templateEn: "This is not my {word}.", templateVi: "Đây không phải là {meaning} của tôi.", pos: 'noun', level: 1, type: 'negative' },
  { id: 108, templateEn: "She has a colorful {word}.", templateVi: "Cô ấy có một {meaning} đầy màu sắc.", pos: 'noun', level: 1, type: 'affirmative' },
  { id: 109, templateEn: "We need a {word} today.", templateVi: "Hôm nay chúng tôi cần một {meaning}.", pos: 'noun', level: 1, type: 'affirmative' },
  { id: 110, templateEn: "Is that your new {word}?", templateVi: "Đó có phải là {meaning} mới của bạn không?", pos: 'noun', level: 1, type: 'question' },
  { id: 111, templateEn: "My father bought a {word}.", templateVi: "Bố tôi đã mua một {meaning}.", pos: 'noun', level: 1, type: 'affirmative' },
  { id: 112, templateEn: "There is a {word} on the desk.", templateVi: "Có một {meaning} ở trên bàn học.", pos: 'noun', level: 1, type: 'affirmative' },
  { id: 113, templateEn: "I can draw a {word}.", templateVi: "Tôi có thể vẽ một {meaning}.", pos: 'noun', level: 1, type: 'affirmative' },
  { id: 114, templateEn: "Can I borrow your {word}?", templateVi: "Tôi có thể mượn {meaning} của bạn không?", pos: 'noun', level: 1, type: 'question' },
  { id: 115, templateEn: "The little boy wants a {word}.", templateVi: "Cậu bé nhỏ muốn có một {meaning}.", pos: 'noun', level: 1, type: 'affirmative' },

  // Level 2: Intermediate (3-4 stars)
  { id: 116, templateEn: "The {word} is very popular today.", templateVi: "{meaningCapitalized} đang rất được ưa chuộng hôm nay.", pos: 'noun', level: 2, type: 'affirmative' },
  { id: 117, templateEn: "I am looking for my {word}.", templateVi: "Tôi đang tìm kiếm {meaning} của mình.", pos: 'noun', level: 2, type: 'affirmative' },
  { id: 118, templateEn: "This modern {word} has many features.", templateVi: "{meaningCapitalized} hiện đại này có rất nhiều tính năng.", pos: 'noun', level: 2, type: 'affirmative' },
  { id: 119, templateEn: "We are learning about the {word}.", templateVi: "Chúng tôi đang học về {meaning}.", pos: 'noun', level: 2, type: 'affirmative' },
  { id: 120, templateEn: "You should protect your {word}.", templateVi: "Bạn nên bảo vệ {meaning} của mình.", pos: 'noun', level: 2, type: 'affirmative' },
  { id: 121, templateEn: "He explained how the {word} works.", templateVi: "Anh ấy đã giải thích cách {meaning} hoạt động.", pos: 'noun', level: 2, type: 'affirmative' },
  { id: 122, templateEn: "Our community needs this {word}.", templateVi: "Cộng đồng của chúng tôi cần {meaning} này.", pos: 'noun', level: 2, type: 'affirmative' },
  { id: 123, templateEn: "I prefer this {word} to that one.", templateVi: "Tôi thích {meaning} này hơn cái kia.", pos: 'noun', level: 2, type: 'complex' },
  { id: 124, templateEn: "The history of this {word} is cool.", templateVi: "Lịch sử của {meaning} này rất thú vị.", pos: 'noun', level: 2, type: 'affirmative' },
  { id: 125, templateEn: "We took a photo of the {word}.", templateVi: "Chúng tôi đã chụp một tấm ảnh về {meaning}.", pos: 'noun', level: 2, type: 'affirmative' },

  // Level 3: Advanced (5 stars)
  { id: 126, templateEn: "The {word} is too big to carry.", templateVi: "{meaningCapitalized} quá to để mang theo bên mình.", pos: 'noun', level: 3, type: 'complex' },
  { id: 127, templateEn: "This {word} is as valuable as gold.", templateVi: "{meaningCapitalized} này quý giá như vàng vậy.", pos: 'noun', level: 3, type: 'complex' },
  { id: 128, templateEn: "The {word} was created to help people.", templateVi: "{meaningCapitalized} được tạo ra để giúp đỡ mọi người.", pos: 'noun', level: 3, type: 'complex' },
  { id: 129, templateEn: "If we have a {word}, we will succeed.", templateVi: "Nếu chúng ta có {meaning}, chúng ta sẽ thành công.", pos: 'noun', level: 3, type: 'complex' },
  { id: 130, templateEn: "The new {word} is better than before.", templateVi: "{meaningCapitalized} mới tốt hơn trước rất nhiều.", pos: 'noun', level: 3, type: 'complex' },
  { id: 131, templateEn: "Scientists are studying this {word}.", templateVi: "Các nhà khoa học đang nghiên cứu về {meaning} này.", pos: 'noun', level: 3, type: 'affirmative' },
  { id: 132, templateEn: "Understanding the {word} takes time.", templateVi: "Hiểu được {meaning} cần có thời gian.", pos: 'noun', level: 3, type: 'affirmative' },
  { id: 133, templateEn: "This {word} plays an important role.", templateVi: "{meaningCapitalized} này đóng một vai trò quan trọng.", pos: 'noun', level: 3, type: 'affirmative' },
  { id: 134, templateEn: "The {word} is considered the best choice.", templateVi: "{meaningCapitalized} được coi là sự lựa chọn tốt nhất.", pos: 'noun', level: 3, type: 'complex' },
  { id: 135, templateEn: "No other {word} can replace this.", templateVi: "Không có {meaning} nào khác có thể thay thế điều này.", pos: 'noun', level: 3, type: 'negative' },

  // ==========================================
  // 2. ĐỘNG TỪ (VERBS) - 25 TEMPLATES
  // ==========================================
  // Level 1: Starter
  { id: 201, templateEn: "I like to {word} with my friends.", templateVi: "Tôi thích {meaning} cùng các bạn của tôi.", pos: 'verb', level: 1, type: 'affirmative' },
  { id: 202, templateEn: "We {word} together every morning.", templateVi: "Chúng tôi cùng nhau {meaning} mỗi buổi sáng.", pos: 'verb', level: 1, type: 'affirmative' },
  { id: 203, templateEn: "Can you {word} with me?", templateVi: "Bạn có thể {meaning} cùng tôi được không?", pos: 'verb', level: 1, type: 'question' },
  { id: 204, templateEn: "I do not want to {word} today.", templateVi: "Hôm nay tôi không muốn {meaning}.", pos: 'verb', level: 1, type: 'negative' },
  { id: 205, templateEn: "He can {word} very fast.", templateVi: "Cậu ấy có thể {meaning} rất nhanh.", pos: 'verb', level: 1, type: 'affirmative' },
  { id: 206, templateEn: "Do not {word} when you are tired.", templateVi: "Đừng {meaning} khi bạn đang thấy mệt.", pos: 'verb', level: 1, type: 'negative' },
  { id: 207, templateEn: "Children always love to {word}.", templateVi: "Các bạn nhỏ luôn luôn thích {meaning}.", pos: 'verb', level: 1, type: 'affirmative' },
  { id: 208, templateEn: "She will {word} after school.", templateVi: "Cô ấy sẽ {meaning} sau giờ học.", pos: 'verb', level: 1, type: 'affirmative' },
  { id: 209, templateEn: "Why do you want to {word}?", templateVi: "Tại sao bạn lại muốn {meaning}?", pos: 'verb', level: 1, type: 'question' },
  { id: 210, templateEn: "Let us {word} in the garden.", templateVi: "Chúng ta hãy {meaning} ở trong vườn nhé.", pos: 'verb', level: 1, type: 'affirmative' },

  // Level 2: Intermediate
  { id: 211, templateEn: "I am learning how to {word} well.", templateVi: "Tôi đang học cách {meaning} thật giỏi.", pos: 'verb', level: 2, type: 'affirmative' },
  { id: 212, templateEn: "You must {word} carefully every time.", templateVi: "Bạn phải {meaning} cẩn thận mỗi lần.", pos: 'verb', level: 2, type: 'affirmative' },
  { id: 213, templateEn: "She decided to {word} for the team.", templateVi: "Cô ấy đã quyết định {meaning} cho cả đội.", pos: 'verb', level: 2, type: 'affirmative' },
  { id: 214, templateEn: "We practice how to {word} correctly.", templateVi: "Chúng tôi luyện tập cách {meaning} chuẩn xác.", pos: 'verb', level: 2, type: 'affirmative' },
  { id: 215, templateEn: "He enjoys the chance to {word}.", templateVi: "Anh ấy hào hứng với cơ hội được {meaning}.", pos: 'verb', level: 2, type: 'affirmative' },
  { id: 216, templateEn: "Everyone stopped to watch them {word}.", templateVi: "Mọi người dừng lại để nhìn họ {meaning}.", pos: 'verb', level: 2, type: 'affirmative' },
  { id: 217, templateEn: "I usually {word} on the weekend.", templateVi: "Tôi thường {meaning} vào dịp cuối tuần.", pos: 'verb', level: 2, type: 'affirmative' },
  { id: 218, templateEn: "Could you teach me how to {word}?", templateVi: "Bạn có thể dạy tôi cách {meaning} không?", pos: 'verb', level: 2, type: 'question' },

  // Level 3: Advanced
  { id: 219, templateEn: "It is too hard to {word} alone.", templateVi: "Quá khó để có thể {meaning} một mình.", pos: 'verb', level: 3, type: 'complex' },
  { id: 220, templateEn: "Learning to {word} is as fun as play.", templateVi: "Học cách {meaning} cũng vui như chơi đùa.", pos: 'verb', level: 3, type: 'complex' },
  { id: 221, templateEn: "If you {word} daily, you will succeed.", templateVi: "Nếu bạn {meaning} mỗi ngày, bạn sẽ thành công.", pos: 'verb', level: 3, type: 'complex' },
  { id: 222, templateEn: "They {word} in order to stay healthy.", templateVi: "Họ {meaning} để giữ gìn sức khỏe dẻo dai.", pos: 'verb', level: 3, type: 'complex' },
  { id: 223, templateEn: "She was excited to {word} abroad.", templateVi: "Cô ấy rất hào hứng được {meaning} ở nước ngoài.", pos: 'verb', level: 3, type: 'affirmative' },
  { id: 224, templateEn: "We should {word} to protect the planet.", templateVi: "Chúng ta nên {meaning} để bảo vệ hành tinh.", pos: 'verb', level: 3, type: 'complex' },
  { id: 225, templateEn: "He is capable enough to {word} well.", templateVi: "Cậu ấy đủ năng lực để {meaning} rất tốt.", pos: 'verb', level: 3, type: 'complex' },

  // ==========================================
  // 3. TÍNH TỪ (ADJECTIVES) - 25 TEMPLATES
  // ==========================================
  // Level 1: Starter
  { id: 301, templateEn: "The little cat is very {word}.", templateVi: "Chú mèo con thì rất {meaning}.", pos: 'adjective', level: 1, type: 'affirmative' },
  { id: 302, templateEn: "Today is a {word} and sunny day.", templateVi: "Hôm nay là một ngày {meaning} và nắng ấm.", pos: 'adjective', level: 1, type: 'affirmative' },
  { id: 303, templateEn: "My new shoes are so {word}.", templateVi: "Đôi giày mới của tôi thật là {meaning}.", pos: 'adjective', level: 1, type: 'affirmative' },
  { id: 304, templateEn: "Why are you looking so {word}?", templateVi: "Tại sao trông bạn lại {meaning} như vậy?", pos: 'adjective', level: 1, type: 'question' },
  { id: 305, templateEn: "This story is very {word}.", templateVi: "Câu chuyện này rất là {meaning}.", pos: 'adjective', level: 1, type: 'affirmative' },
  { id: 306, templateEn: "She has a warm and {word} smile.", templateVi: "Cô ấy có một nụ cười ấm áp và {meaning}.", pos: 'adjective', level: 1, type: 'affirmative' },
  { id: 307, templateEn: "I feel so {word} on my birthday.", templateVi: "Tôi cảm thấy thật {meaning} trong ngày sinh nhật.", pos: 'adjective', level: 1, type: 'affirmative' },
  { id: 308, templateEn: "The water is not {word} at all.", templateVi: "Nước hoàn toàn không {meaning} chút nào.", pos: 'adjective', level: 1, type: 'negative' },
  { id: 309, templateEn: "We found a cozy and {word} room.", templateVi: "Chúng tôi đã tìm thấy một căn phòng {meaning}.", pos: 'adjective', level: 1, type: 'affirmative' },
  { id: 310, templateEn: "Is your English teacher {word}?", templateVi: "Giáo viên tiếng Anh của bạn có {meaning} không?", pos: 'adjective', level: 1, type: 'question' },

  // Level 2: Intermediate
  { id: 311, templateEn: "The weather is becoming more {word}.", templateVi: "Thời tiết đang dần trở nên {meaning} hơn.", pos: 'adjective', level: 2, type: 'affirmative' },
  { id: 312, templateEn: "She always stays {word} under pressure.", templateVi: "Cô ấy luôn giữ được vẻ {meaning} khi áp lực.", pos: 'adjective', level: 2, type: 'affirmative' },
  { id: 313, templateEn: "We had a very {word} discussion.", templateVi: "Chúng tôi đã có một buổi thảo luận rất {meaning}.", pos: 'adjective', level: 2, type: 'affirmative' },
  { id: 314, templateEn: "It is important to stay {word}.", templateVi: "Điều quan trọng là phải luôn giữ mình {meaning}.", pos: 'adjective', level: 2, type: 'affirmative' },
  { id: 315, templateEn: "He gave us a truly {word} speech.", templateVi: "Cậu ấy đã mang lại một bài nói thật sự {meaning}.", pos: 'adjective', level: 2, type: 'affirmative' },
  { id: 316, templateEn: "That was the most {word} moment.", templateVi: "Đó chính là khoảnh khắc {meaning} nhất.", pos: 'adjective', level: 2, type: 'complex' },
  { id: 317, templateEn: "Our team was confident and {word}.", templateVi: "Đội chúng tôi rất tự tin và {meaning}.", pos: 'adjective', level: 2, type: 'affirmative' },
  { id: 318, templateEn: "The mountain path was steep and {word}.", templateVi: "Lối mòn trên núi dốc và rất {meaning}.", pos: 'adjective', level: 2, type: 'affirmative' },

  // Level 3: Advanced
  { id: 319, templateEn: "The puzzle is too {word} to solve.", templateVi: "Câu đố quá {meaning} để có thể giải ngay.", pos: 'adjective', level: 3, type: 'complex' },
  { id: 320, templateEn: "Her voice is as {word} as music.", templateVi: "Giọng nói của cô ấy {meaning} như khúc nhạc.", pos: 'adjective', level: 3, type: 'complex' },
  { id: 321, templateEn: "If you are {word}, you will win.", templateVi: "Nếu bạn luôn {meaning}, bạn sẽ chiến thắng.", pos: 'adjective', level: 3, type: 'complex' },
  { id: 322, templateEn: "Nothing is more {word} than freedom.", templateVi: "Không có gì {meaning} hơn là sự tự do.", pos: 'adjective', level: 3, type: 'complex' },
  { id: 323, templateEn: "The ecosystem is fragile and {word}.", templateVi: "Hệ sinh thái rất mỏng manh và {meaning}.", pos: 'adjective', level: 3, type: 'affirmative' },
  { id: 324, templateEn: "This idea is far more {word} than that.", templateVi: "Ý tưởng này {meaning} hơn cái kia rất nhiều.", pos: 'adjective', level: 3, type: 'complex' },
  { id: 325, templateEn: "Solar power is a {word} energy source.", templateVi: "Năng lượng mặt trời là nguồn năng lượng {meaning}.", pos: 'adjective', level: 3, type: 'affirmative' },

  // ==========================================
  // 4. TRẠNG TỪ (ADVERBS) - 15 TEMPLATES
  // ==========================================
  { id: 401, templateEn: "The smart puppy runs very {word}.", templateVi: "Chú cún thông minh chạy rất {meaning}.", pos: 'adverb', level: 1, type: 'affirmative' },
  { id: 402, templateEn: "Please speak {word} so I can hear.", templateVi: "Làm ơn hãy nói {meaning} để tôi có thể nghe rõ.", pos: 'adverb', level: 1, type: 'affirmative' },
  { id: 403, templateEn: "She solved the puzzle {word}.", templateVi: "Cô ấy đã giải câu đố một cách {meaning}.", pos: 'adverb', level: 1, type: 'affirmative' },
  { id: 404, templateEn: "The birds sing {word} in the morning.", templateVi: "Những chú chim hót líu lo {meaning} buổi sớm.", pos: 'adverb', level: 1, type: 'affirmative' },
  { id: 405, templateEn: "The boy finished his task {word}.", templateVi: "Cậu bé đã hoàn thành bài tập một cách {meaning}.", pos: 'adverb', level: 1, type: 'affirmative' },
  { id: 406, templateEn: "He answered all questions {word}.", templateVi: "Anh ấy đã trả lời mọi câu hỏi rất {meaning}.", pos: 'adverb', level: 2, type: 'affirmative' },
  { id: 407, templateEn: "We should carry the glass {word}.", templateVi: "Chúng ta nên mang ly thủy tinh một cách {meaning}.", pos: 'adverb', level: 2, type: 'affirmative' },
  { id: 408, templateEn: "The students listened {word} in class.", templateVi: "Các học sinh đã lắng nghe rất {meaning} trong lớp.", pos: 'adverb', level: 2, type: 'affirmative' },
  { id: 409, templateEn: "She walked {word} into the quiet room.", templateVi: "Cô ấy bước {meaning} vào căn phòng yên tĩnh.", pos: 'adverb', level: 2, type: 'affirmative' },
  { id: 410, templateEn: "Do not drive too {word} on rainy days.", templateVi: "Đừng lái xe quá {meaning} vào những ngày mưa.", pos: 'adverb', level: 2, type: 'negative' },
  { id: 411, templateEn: "He moved too {word} to be caught.", templateVi: "Anh ấy di chuyển quá {meaning} để bị bắt kịp.", pos: 'adverb', level: 3, type: 'complex' },
  { id: 412, templateEn: "She works as {word} as a bee.", templateVi: "Cô ấy làm việc {meaning} như một chú ong chăm chỉ.", pos: 'adverb', level: 3, type: 'complex' },
  { id: 413, templateEn: "The system runs {word} and reliably.", templateVi: "Hệ thống vận hành một cách {meaning} và tin cậy.", pos: 'adverb', level: 3, type: 'affirmative' },
  { id: 414, templateEn: "If you speak {word}, everyone listens.", templateVi: "Nếu bạn nói năng {meaning}, mọi người sẽ lắng nghe.", pos: 'adverb', level: 3, type: 'complex' },
  { id: 415, templateEn: "She adapted {word} to the new school.", templateVi: "Cô ấy đã thích nghi rất {meaning} với ngôi trường mới.", pos: 'adverb', level: 3, type: 'affirmative' },

  // ==========================================
  // 5. GIỚI TỪ (PREPOSITIONS) - 15 TEMPLATES
  // ==========================================
  { id: 501, templateEn: "The book is {word} the table.", templateVi: "Quyển sách đang ở {meaning} cái bàn.", pos: 'preposition', level: 1, type: 'affirmative' },
  { id: 502, templateEn: "The cat sleeps {word} the warm bed.", templateVi: "Con mèo ngủ ở {meaning} chiếc giường ấm.", pos: 'preposition', level: 1, type: 'affirmative' },
  { id: 503, templateEn: "I play football {word} my friends.", templateVi: "Tôi chơi đá bóng cùng {meaning} bạn bè của mình.", pos: 'preposition', level: 1, type: 'affirmative' },
  { id: 504, templateEn: "We walk happily {word} the school gate.", templateVi: "Chúng tôi vui vẻ đi bộ {meaning} cổng trường.", pos: 'preposition', level: 1, type: 'affirmative' },
  { id: 505, templateEn: "Put the red apple {word} the basket.", templateVi: "Hãy đặt quả táo đỏ vào {meaning} giỏ nhé.", pos: 'preposition', level: 1, type: 'affirmative' },
  { id: 506, templateEn: "Is your pen {word} the pencil case?", templateVi: "Chiếc bút của bạn có ở {meaning} hộp bút không?", pos: 'preposition', level: 1, type: 'question' },
  { id: 507, templateEn: "The secret path runs {word} two hills.", templateVi: "Lối mòn bí mật chạy qua {meaning} hai ngọn đồi.", pos: 'preposition', level: 2, type: 'affirmative' },
  { id: 508, templateEn: "He stood quietly {word} the library.", templateVi: "Anh ấy đứng yên lặng ở {meaning} thư viện.", pos: 'preposition', level: 2, type: 'affirmative' },
  { id: 509, templateEn: "They traveled all the way {word} France.", templateVi: "Họ đã đi du lịch suốt chặng đường {meaning} nước Pháp.", pos: 'preposition', level: 2, type: 'affirmative' },
  { id: 510, templateEn: "The bird flew high {word} the blue sky.", templateVi: "Chú chim bay lượn trên cao {meaning} bầu trời xanh.", pos: 'preposition', level: 2, type: 'affirmative' },
  { id: 511, templateEn: "We sat comfortably {word} the big tree.", templateVi: "Chúng tôi ngồi thoải mái ở {meaning} gốc cây to.", pos: 'preposition', level: 2, type: 'affirmative' },
  { id: 512, templateEn: "The bridge was built {word} great care.", templateVi: "Cây cầu được xây dựng {meaning} sự cẩn trọng lớn.", pos: 'preposition', level: 3, type: 'affirmative' },
  { id: 513, templateEn: "The truth was hidden deep {word} facts.", templateVi: "Sự thật bị che giấu sâu ở {meaning} các sự kiện.", pos: 'preposition', level: 3, type: 'affirmative' },
  { id: 514, templateEn: "Success comes {word} continuous effort.", templateVi: "Thành công đến {meaning} nỗ lực không ngừng nghỉ.", pos: 'preposition', level: 3, type: 'complex' },
  { id: 515, templateEn: "Nothing happens {word} a clear reason.", templateVi: "Không có chuyện gì xảy ra {meaning} một lý do rõ ràng.", pos: 'preposition', level: 3, type: 'negative' },

  // ==========================================
  // 6. ĐẠI TỪ & SỞ HỮU (PRONOUNS) - 15 TEMPLATES
  // ==========================================
  { id: 601, templateEn: "{wordCapitalized} is reading a comic book now.", templateVi: "{meaningCapitalized} đang đọc truyện tranh lúc này.", pos: 'pronoun', level: 1, type: 'affirmative' },
  { id: 602, templateEn: "This colorful pen belongs to {word}.", templateVi: "Chiếc bút đầy màu sắc này thuộc về {meaning}.", pos: 'pronoun', level: 1, type: 'affirmative' },
  { id: 603, templateEn: "Can {word} help me with my homework?", templateVi: "{meaningCapitalized} có thể giúp tôi làm bài tập được không?", pos: 'pronoun', level: 1, type: 'question' },
  { id: 604, templateEn: "We always play happily with {word}.", templateVi: "Chúng tôi luôn chơi đùa vui vẻ cùng {meaning}.", pos: 'pronoun', level: 1, type: 'affirmative' },
  { id: 605, templateEn: "{wordCapitalized} family loves camping outside.", templateVi: "Gia đình của {meaning} rất thích đi cắm trại ngoài trời.", pos: 'pronoun', level: 1, type: 'affirmative' },
  { id: 606, templateEn: "Is that shiny new bike {word}?", templateVi: "Chiếc xe đạp mới sáng bóng kia có phải của {meaning} không?", pos: 'pronoun', level: 1, type: 'question' },
  { id: 607, templateEn: "{wordCapitalized} achieved the best score today.", templateVi: "{meaningCapitalized} đã đạt điểm cao nhất ngày hôm nay.", pos: 'pronoun', level: 2, type: 'affirmative' },
  { id: 608, templateEn: "I admire {word} great passion for art.", templateVi: "Tôi ngưỡng mộ niềm đam mê nghệ thuật của {meaning}.", pos: 'pronoun', level: 2, type: 'affirmative' },
  { id: 609, templateEn: "{wordCapitalized} decided to join the science club.", templateVi: "{meaningCapitalized} đã quyết định tham gia câu lạc bộ khoa học.", pos: 'pronoun', level: 2, type: 'affirmative' },
  { id: 610, templateEn: "Give {word} a warm round of applause.", templateVi: "Hãy dành cho {meaning} một tràng pháo tay thật nồng nhiệt.", pos: 'pronoun', level: 2, type: 'affirmative' },
  { id: 611, templateEn: "It was {word} who encouraged our team.", templateVi: "Chính {meaning} là người đã động viên cả đội chúng tôi.", pos: 'pronoun', level: 3, type: 'complex' },
  { id: 612, templateEn: "Without {word} guidance, we could not win.", templateVi: "Nếu không có sự chỉ dẫn của {meaning}, chúng tôi không thể thắng.", pos: 'pronoun', level: 3, type: 'complex' },
  { id: 613, templateEn: "Everyone looks up to {word} with respect.", templateVi: "Mọi người đều nhìn {meaning} với sự tôn trọng.", pos: 'pronoun', level: 3, type: 'affirmative' },
  { id: 614, templateEn: "If {word} agrees, we can start right away.", templateVi: "Nếu {meaning} đồng ý, chúng ta có thể bắt đầu ngay.", pos: 'pronoun', level: 3, type: 'complex' },
  { id: 615, templateEn: "Neither {word} nor I knew the secret answer.", templateVi: "Cả {meaning} lẫn tôi đều không biết câu trả lời bí mật.", pos: 'pronoun', level: 3, type: 'negative' },

  // ==========================================
  // 7. TỪ CHỈ SỐ LƯỢNG & SỐ ĐẾM (DETERMINERS) - 15 TEMPLATES
  // ==========================================
  { id: 701, templateEn: "I have {word} sweet yellow bananas.", templateVi: "Tôi có {meaning} quả chuối vàng ngọt.", pos: 'determiner', level: 1, type: 'affirmative' },
  { id: 702, templateEn: "There are {word} white birds in the sky.", templateVi: "Có {meaning} con chim trắng trên bầu trời.", pos: 'determiner', level: 1, type: 'affirmative' },
  { id: 703, templateEn: "Do you want {word} fresh apples?", templateVi: "Bạn có muốn {meaning} quả táo tươi ngon không?", pos: 'determiner', level: 1, type: 'question' },
  { id: 704, templateEn: "We saw {word} cute puppies in the yard.", templateVi: "Chúng tôi đã thấy {meaning} chú cún đáng yêu ngoài sân.", pos: 'determiner', level: 1, type: 'affirmative' },
  { id: 705, templateEn: "She picked {word} lovely flowers.", templateVi: "Cô ấy đã hái {meaning} bông hoa xinh xắn.", pos: 'determiner', level: 1, type: 'affirmative' },
  { id: 706, templateEn: "Can I take {word} pencils for drawing?", templateVi: "Tôi có thể lấy {meaning} cây bút chì để vẽ không?", pos: 'determiner', level: 1, type: 'question' },
  { id: 707, templateEn: "The library has {word} useful books.", templateVi: "Thư viện có {meaning} quyển sách hữu ích.", pos: 'determiner', level: 2, type: 'affirmative' },
  { id: 708, templateEn: "He spent {word} hours solving the riddle.", templateVi: "Cậu ấy đã dành {meaning} giờ để giải câu đố.", pos: 'determiner', level: 2, type: 'affirmative' },
  { id: 709, templateEn: "We invited {word} friends to our party.", templateVi: "Chúng tôi đã mời {meaning} người bạn đến bữa tiệc.", pos: 'determiner', level: 2, type: 'affirmative' },
  { id: 710, templateEn: "There were {word} questions in the test.", templateVi: "Đã có {meaning} câu hỏi trong bài kiểm tra.", pos: 'determiner', level: 2, type: 'affirmative' },
  { id: 711, templateEn: "Only {word} students solved the problem.", templateVi: "Chỉ có {meaning} học sinh giải được bài toán.", pos: 'determiner', level: 3, type: 'complex' },
  { id: 712, templateEn: "This project takes {word} days to finish.", templateVi: "Dự án này cần {meaning} ngày để hoàn thành.", pos: 'determiner', level: 3, type: 'affirmative' },
  { id: 713, templateEn: "We discovered {word} interesting facts.", templateVi: "Chúng tôi đã khám phá ra {meaning} sự thật thú vị.", pos: 'determiner', level: 3, type: 'affirmative' },
  { id: 714, templateEn: "If you have {word} minutes, please wait.", templateVi: "Nếu bạn có {meaning} phút, xin vui lòng đợi nhé.", pos: 'determiner', level: 3, type: 'complex' },
  { id: 715, templateEn: "There are {word} reasons to stay hopeful.", templateVi: "Có {meaning} lý do để chúng ta luôn hy vọng.", pos: 'determiner', level: 3, type: 'affirmative' },
];

// Từ điển nhận diện từ loại mở rộng
const KNOWN_PREPOSITIONS = new Set(['in', 'on', 'under', 'at', 'to', 'with', 'behind', 'near', 'from', 'between', 'into', 'over', 'by', 'around', 'about', 'above']);
const KNOWN_PRONOUNS = new Set(['he', 'she', 'it', 'we', 'they', 'i', 'you', 'my', 'your', 'his', 'her', 'our', 'their', 'this', 'that', 'these', 'those', 'me', 'him', 'us', 'them']);
const KNOWN_DETERMINERS = new Set(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'many', 'some', 'all', 'every', 'few', 'much', 'any', 'several', 'both']);
const KNOWN_VERBS = new Set(['run', 'jump', 'play', 'eat', 'drink', 'sleep', 'read', 'write', 'swim', 'walk', 'sing', 'dance', 'fly', 'help', 'see', 'look', 'hear', 'listen', 'watch', 'speak', 'learn', 'study', 'teach', 'protect', 'exercise', 'travel', 'challenge', 'make', 'do', 'come', 'give', 'take', 'open', 'close', 'draw']);
const KNOWN_ADJECTIVES = new Set(['happy', 'sad', 'big', 'small', 'fast', 'slow', 'sweet', 'red', 'blue', 'yellow', 'green', 'white', 'black', 'hot', 'cold', 'warm', 'new', 'old', 'young', 'good', 'bad', 'friendly', 'curious', 'confident', 'creative', 'beautiful', 'sunny', 'rainy', 'clean', 'dirty', 'funny', 'brave', 'strong', 'sustainable']);

export function detectPartOfSpeech(word: string, hintPartOfSpeech?: string): PartOfSpeech {
  const low = word.trim().toLowerCase();
  if (KNOWN_PREPOSITIONS.has(low)) return 'preposition';
  if (KNOWN_PRONOUNS.has(low)) return 'pronoun';
  if (KNOWN_DETERMINERS.has(low)) return 'determiner';
  if (KNOWN_VERBS.has(low)) return 'verb';
  if (KNOWN_ADJECTIVES.has(low)) return 'adjective';
  if (low.endsWith('ly') && low !== 'family' && low !== 'friendly' && low !== 'early') return 'adverb';
  if (['well', 'fast', 'hard', 'early', 'late', 'daily', 'now', 'always', 'often'].includes(low)) return 'adverb';

  if (hintPartOfSpeech) {
    const hint = hintPartOfSpeech.toLowerCase();
    if (hint.includes('verb')) return 'verb';
    if (hint.includes('adjective')) return 'adjective';
    if (hint.includes('adverb')) return 'adverb';
    if (hint.includes('preposition')) return 'preposition';
    if (hint.includes('pronoun')) return 'pronoun';
    if (hint.includes('numeral') || hint.includes('determiner')) return 'determiner';
    if (hint.includes('noun')) return 'noun';
  }
  return 'noun';
}

/**
 * Universal Indefinite Article Corrector:
 * Fixes any 'a/an' occurrence before any word starting with a vowel sound across the entire sentence!
 * E.g.: "This is a apple." -> "This is an apple."
 */
export function fixIndefiniteArticles(sentence: string): string {
  // 1. Fix "a [vowel]" -> "an [vowel]"
  let fixed = sentence.replace(/\b([Aa])\s+([aeiouAEIOU][a-zA-Z]*)/g, (match, art, word) => {
    const isUpper = art === 'A';
    if (/^(university|uniform|unique|useful|union)/i.test(word)) {
      return `${isUpper ? 'A' : 'a'} ${word}`;
    }
    return `${isUpper ? 'An' : 'an'} ${word}`;
  });

  // 2. Fix "an [consonant]" -> "a [consonant]"
  fixed = fixed.replace(/\b([Aa]n)\s+([^aeiouAEIOU\s][a-zA-Z]*)/g, (match, art, word) => {
    const isUpper = art === 'An';
    if (/^(hour|honest|honor)/i.test(word)) {
      return `${isUpper ? 'An' : 'an'} ${word}`;
    }
    return `${isUpper ? 'A' : 'a'} ${word}`;
  });

  return fixed;
}

/**
 * Sinh mẫu câu với cơ chế Chống lặp (Anti-Repetition) tuyệt đối:
 * Không bao giờ chọn lại mẫu câu đã xuất hiện trong danh sách usedTemplateIds của ván chơi.
 */
export function generateKidSentenceNoRepeat(
  wordItem: WordItem, 
  userLevel: number, 
  usedTemplateIds: Set<number>
): SentenceItem {
  const wordEn = wordItem.word.toLowerCase();
  const pos = detectPartOfSpeech(wordEn, wordItem.partOfSpeech);

  // Nghĩa tiếng Việt thuần khiết
  const meaningClean = (wordItem.meaningVi || wordEn)
    .replace(/^từ:\s*/i, '')
    .trim()
    .toLowerCase();
  const meaningCap = meaningClean.charAt(0).toUpperCase() + meaningClean.slice(1);
  const wordCap = wordEn.charAt(0).toUpperCase() + wordEn.slice(1);

  // Xác định cấp độ: Level 1 (bé mới), Level 2 (trung cấp), Level 3 (nâng cao)
  const targetLevel = userLevel >= 4 ? 3 : userLevel >= 2 ? 2 : 1;

  // 1. Lọc tất cả template đúng từ loại và phù hợp cấp độ
  const matchingTemplates = COMPREHENSIVE_TEMPLATES.filter((t) => {
    if (t.pos !== pos) return false;
    return t.level <= targetLevel;
  });

  // 2. Loại bỏ các template ĐÃ DÙNG trong ván này để không bao giờ bị lặp lại!
  let freshPool = matchingTemplates.filter((t) => !usedTemplateIds.has(t.id));
  
  // Nếu đã dùng hết thì reset lại pool của từ loại này
  if (freshPool.length === 0) {
    freshPool = matchingTemplates.length > 0 ? matchingTemplates : COMPREHENSIVE_TEMPLATES.filter(t => t.pos === pos);
  }

  // Chọn ngẫu nhiên 1 template chưa dùng trong pool
  const chosenIndex = Math.floor(Math.random() * freshPool.length);
  const template = freshPool[chosenIndex] || COMPREHENSIVE_TEMPLATES[0];

  // Ghi nhận template đã dùng
  usedTemplateIds.add(template.id);

  const rawSentenceEn = template.templateEn
    .replace('{wordCapitalized}', wordCap)
    .replace('{word}', wordEn);

  // Áp dụng bộ hiệu chỉnh ngữ pháp mạo từ a/an toàn diện
  const sentenceEn = fixIndefiniteArticles(rawSentenceEn);

  const sentenceVi = template.templateVi
    .replace('{meaningCapitalized}', meaningCap)
    .replace('{meaning}', meaningClean);

  return {
    id: template.id,
    sentenceEn,
    sentenceVi,
    partOfSpeech: pos,
    level: template.level,
  };
}
