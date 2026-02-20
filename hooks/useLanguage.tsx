import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'english' | 'vietnamese';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: (key: string, ...args: (string | number)[]) => string;
}

const translations: Record<string, string> = {
    "About MemoryDeck": "Về MemoryDeck",
    "Study Smarter. Remember Longer. Level Up Your English.": "Học thông minh hơn. Nhớ lâu hơn. Nâng cấp tiếng Anh của bạn.",
    "Tired of memorizing vocabulary only to forget it the next day?": "Học từ hôm nay, mai quên sạch?",
    "MemoryDeck is here to fix that.": "MemoryDeck sinh ra để giải quyết chuyện đó.",
    "Built on powerful learning science like Active Recall and Spaced Repetition, MemoryDeck helps you lock words into your long-term memory — not just cram and forget. You’ll spend less time re-reading and more time actually remembering.": "Ứng dụng áp dụng những phương pháp học đã được chứng minh hiệu quả như Gợi nhớ chủ động (Active Recall) và Lặp lại ngắt quãng (Spaced Repetition) — giúp bạn ghi nhớ sâu và lâu dài, thay vì học vẹt rồi quên.",
    "Create your own decks, customize your learning flow, and focus on what truly matters to you — whether that’s TOEIC, IELTS, work vocabulary, or daily conversation skills.": "Tự tạo bộ thẻ theo mục tiêu của riêng bạn — luyện TOEIC, IELTS, từ vựng chuyên ngành hay giao tiếp hằng ngày. Bạn học gì, học thế nào, là do bạn quyết định.",
    "Switch things up with multiple learning modes:": "Đa dạng chế độ học để không bao giờ thấy chán:",
    "🃏 Flashcards for quick recall": "🃏 Flashcard – lật thẻ, nhớ nhanh",
    "📝 Quizzes to test your memory": "📝 Quiz – kiểm tra trí nhớ",
    "🎯 Matching games to boost speed": "🎯 Ghép cặp – tăng phản xạ",
    "🔊 AI-powered Spelling practice to train your ears and typing": "🔊 Luyện chính tả với AI – nghe và gõ chuẩn chỉnh",
    "Clean design. No distractions. Works offline.": "Giao diện gọn gàng. Không xao nhãng. Dùng được cả khi offline.",
    "Just you and your progress.": "Chỉ còn bạn và hành trình tiến bộ mỗi ngày.",
    "MemoryDeck isn’t just another vocab app.": "MemoryDeck không chỉ là app học từ vựng.",
    "It’s your glow-up tool for English fluency. 🚀": "Đó là công cụ giúp bạn “level up” tiếng Anh một cách thật sự. 🚀",
    "About the Developer": "Về Nhà Phát Triển",
    "Built with passion by Dao Hieu": "Được xây dựng với đam mê bởi Đào Hiếu",
    "MemoryDeck was designed and developed by Dao Hieu (Đào Hiếu) — a passionate developer who believes that learning should be smart, efficient, and actually enjoyable.": "MemoryDeck được thiết kế và phát triển bởi Đào Hiếu — một lập trình viên yêu thích việc tạo ra những công cụ học tập thông minh, hiệu quả và dễ tiếp cận.",
    "This project is the result of a deep interest in language learning, cognitive science, and modern app development. Countless hours were spent researching how memory works, experimenting with UI/UX design, and refining every detail to create a smooth, distraction-free learning experience.": "Dự án này là sự kết hợp giữa niềm đam mê với học ngôn ngữ, khoa học ghi nhớ và phát triển ứng dụng hiện đại. Rất nhiều thời gian đã được đầu tư để nghiên cứu cách bộ não ghi nhớ thông tin, tối ưu trải nghiệm người dùng (UI/UX), và tinh chỉnh từng chi tiết nhỏ để mang lại trải nghiệm học tập mượt mà, không xao nhãng.",
    "MemoryDeck isn’t just another side project — it’s a mission to build tools that genuinely help people grow.": "MemoryDeck không chỉ là một sản phẩm công nghệ mà là mong muốn tạo ra một công cụ thực sự giúp mọi người tiến bộ mỗi ngày.",
    "If you’d like to connect, collaborate, or share feedback:": "Nếu bạn muốn kết nối hoặc đóng góp ý kiến:",
    "🌐 GitHub: https://github.com/daohieuit": "🌐 GitHub: https://github.com/daohieuit",
    "📩 Email: daohieuit0803@gmail.com": "📩 Email: daohieuit0803@gmail.com",
    "Thank you for being part of this journey.": "Cảm ơn bạn đã tin tưởng và sử dụng MemoryDeck.",
    "Let’s keep learning and leveling up together. 🚀": "Cùng nhau “level up” mỗi ngày nhé! 🚀",
    "This page is currently under construction. ✨": "Trang này đang được update. ✨",
    "More information about the application will be available here soon!": "Thông tin xịn sò về app sẽ sớm xuất hiện tại đây nha!",
    "Go back to Dashboard": "Về Trang chủ",
    "Dashboard": "Trang chủ",
    "My Decks": "Thư viện",
    "Appearance": "Giao diện",
    "Light Mode": "Sáng",
    "Dark Mode": "Tối",
    "Language": "Ngôn ngữ",
    "Tiếng Việt": "Tiếng Việt",
    "English": "English",
    "Application": "Ứng dụng",
    "About": "Về MemoryDeck",
    "Version": "Phiên bản",
    "Invalid deck or mode selected!": "Bộ thẻ hoặc chế độ này không hợp lệ rồi!",
    "Unknown mode": "Không nhận diện được chế độ này",
    "Back to Dashboard": "Về Trang chủ",
    "Mode": "Chế độ",
    "Deck:": "Bộ thẻ:",
    "Welcome Back! 👋": "Chào mừng bạn quay lại! 👋",
    "Welcome Back": "Chào mừng bạn quay lại",
    "Choose a deck to start learning. 💪": "Chọn một bộ thẻ để bắt đầu “chiến” nào. 💪",
    "No Decks Found": "Chưa có bộ thẻ nào cả",
    "Get started by creating your first deck!": "Tạo bộ thẻ đầu tiên để bắt đầu học nhé!",
    "Create a Deck": "Tạo bộ thẻ mới",
    "Select a mode to begin your learning session for this deck.": "Chọn chế độ học phù hợp với bạn nha.",
    "Flashcard": "Flashcard",
    "Quiz": "Quiz",
    "Matching": "Ghép từ",
    "Spelling": "Chính tả",
    "Cards in this Deck": "Thẻ trong bộ này",
    "Add New": "Thêm thẻ",
    "This deck is empty. Click 'Edit' to add your first card.": "Bộ thẻ này chưa có gì cả. Nhấn \"Chỉnh sửa\" để thêm thẻ đầu tiên nha!",
    "Term *": "Từ vựng *",
    "Definition *": "Nghĩa *",
    "Function": "Từ loại",
    "IPA": "Phiên âm (IPA)",
    "Add New Cards": "Thêm thẻ mới",
    "Bulk Import": "Nhập nhiều thẻ",
    "Function (e.g., n, adj, adv, v)": "Từ loại (vd: n, adj, adv, v)",
    "IPA (Optional)": "Phiên âm (không bắt buộc)",
    "Add Row": "Thêm dòng",
    "Save Cards": "Lưu",
    "Bulk Import Cards": "Nhập nhiều thẻ cùng lúc",
    "Paste your card data below. Each new line represents a separate card.": "Dán dữ liệu vào bên dưới. Mỗi dòng là một thẻ nhé.",
    "Supported Formats (use Tab to separate fields):": "Định dạng hỗ trợ (dùng Tab để tách các cột):",
    "Cancel": "Hủy",
    "Import Cards": "Nhập vào",
    "Manage My Decks": "Quản lý bộ thẻ",
    "Create New Deck": "Tạo bộ thẻ mới",
    "e.g., TOEIC Vocabulary": "Ví dụ: Từ vựng TOEIC",
    "Create Deck": "Tạo",
    "You don't have any decks yet.": "Bạn chưa có bộ thẻ nào hết.",
    "cards": "thẻ",
    "Edit": "Chỉnh sửa",
    "Delete": "Xóa",
    "No terms available in this deck.": "Bộ thẻ này chưa có từ nào cả.",
    "Click to flip": "Nhấn để lật thẻ",
    "Hard 😵": "Khó quá 😵",
    "Good 👍": "Ổn áp 👍",
    "Easy 😎": "Dễ ẹc 😎",
    "Confirm": "Xác nhận",
    "OK": "OK",
    "Quiz Finished!": "Xong rồi!",
    "Your score:": "Điểm của bạn:",
    "You need at least 4 terms in this deck to start a quiz.": "Cần ít nhất 4 từ để bắt đầu Quiz nhé.",
    "Question": "Câu",
    "of": "/",
    "Which of the following best defines this term?": "Nghĩa nào đúng nhất với từ này?",
    "Correct! 🎯": "Chuẩn luôn! 🎯",
    "Incorrect!": "Chưa đúng rồi!",
    "The correct answer was:": "Đáp án đúng là:",
    "Next Question": "Câu tiếp theo",
    "Finish Quiz": "Kết thúc",
    "Speech Synthesis Not Supported": "Không hỗ trợ đọc từ",
    "Your browser does not support the text-to-speech feature required for this mode.": "Thiết bị của bạn chưa hỗ trợ tính năng đọc từ cho chế độ này.",
    "Congratulations! 🎉": "Tuyệt vời! 🎉",
    "You have completed all spelling terms!": "Bạn đã hoàn thành hết các từ rồi!",
    "Term": "Từ",
    "Type the term here": "Nhập từ vào đây",
    "Check": "Kiểm tra",
    "You need at least 2 terms in this deck to play the matching game.": "Cần ít nhất 2 từ để chơi ghép cặp nha.",
    "You've matched all the terms in": "Bạn đã ghép hết các từ trong",
    "Play Again": "Chơi lại",
    "Undo": "Hoàn tác",
    "Delete Deck": "Xóa bộ thẻ",
    "Are you sure you want to delete this entire deck and all its cards? This action cannot be undone.": "Bạn chắc chắn muốn xóa toàn bộ bộ thẻ này không? Hành động này không thể hoàn tác đâu nhé.",
    "Deleted \"...\"": "Đã xóa \"...\"",
    "Deck name cannot be empty.": "Tên bộ thẻ không được để trống.",
    "Deck name contains invalid characters. Only letters, numbers, and spaces are allowed.": "Tên bộ thẻ chứa ký tự không hợp lệ. Chỉ được phép dùng chữ cái, số và khoảng trắng.",
    "A deck with this name already exists.": "Tên bộ thẻ này đã tồn tại.",
    "Export Data": "Xuất dữ liệu",
    "Import Data": "Nhập dữ liệu",
    "Export All": "Xuất tất cả",
    "Export Decks Only": "Chỉ xuất bộ thẻ",
    "Export the entire database.": "Xuất toàn bộ cơ sở dữ liệu.",
    "Choose one or more specific decks to export.": "Chọn một hoặc nhiều bộ thẻ cụ thể để xuất.",
    "Export Options": "Tùy chọn xuất",
    "Select Decks to Export": "Chọn bộ thẻ để xuất",
    "All Decks": "Tất cả bộ thẻ",
    "Select Save Location": "Chọn vị trí lưu",
    "Search decks...": "Tìm bộ thẻ...",
    "Clear search": "Xóa tìm kiếm",
    "What's New": "Có gì mới",
    "What's New Content Placeholder": "Nội dung cập nhật sẽ hiển thị ở đây.",
    "Whats New Introduction": "Các cập nhật chính:",
    "Enhanced Import/Export UI": "Giao diện Xuất/Nhập được cải tiến",
    "Integrated Search Functionality": "Chức năng tìm kiếm tích hợp",
    "Created at": "Ngày tạo",
    "Proceed to next learning mode?": "Tiếp tục sang chế độ học tiếp theo?",
    "Yes": "Đồng ý",
    "No": "Không",
    "Congratulations! You have completed this deck.": "Chúc mừng! Bạn đã hoàn thành bộ thẻ này.",
    "Next question in {0}s...": "Câu hỏi tiếp theo trong {0}s...",
    "Last studied": "Học lần cuối",
    "Not studied yet": "Chưa học lần nào",
    "Just now": "Vừa xong",
    "{0} minutes ago": "{0} phút trước",
    "1 hour ago": "1 giờ trước",
    "{0} hours ago": "{0} giờ trước",
    "1 day ago": "1 ngày trước",
    "{0} days ago": "{0} ngày trước",
    "No decks found matching your search.": "Không tìm thấy bộ thẻ nào phù hợp.",
    "Session Completed!": "Hoàn thành!",
    "Deck renamed successfully!": "Đổi tên bộ thẻ thành công!",
    "Failed to rename deck.": "Đổi tên bộ thẻ thất bại.",
    "Save": "Lưu",
    "Save changes": "Lưu thay đổi",
    "Cancel editing": "Hủy chỉnh sửa",
    "Rename deck": "Đổi tên bộ thẻ",
    "Cancel renaming deck": "Hủy đổi tên bộ thẻ",
    "Edit deck": "Chỉnh sửa bộ thẻ",
    "Edit Deck": "Chỉnh sửa bộ thẻ",
    "Deck Completed!": "Hoàn thành bộ thẻ!",
    "You've finished your session for:": "Bạn đã hoàn thành phiên học cho:",
    "Return to Dashboard": "Về Trang chủ",
    "Flashcard Mode": "Chế độ Flashcard",
    "Total Cards Reviewed:": "Tổng số thẻ đã xem:",
    "Easy:": "Dễ:",
    "Good:": "Tốt:",
    "Hard:": "Khó:",
    "Quiz Mode": "Chế độ Quiz",
    "Score:": "Điểm:",
    "Matching Mode": "Chế độ Ghép từ",
    "Time Taken:": "Thời gian:",
    "Matched Pairs:": "Cặp đã ghép:",
    "Spelling Mode": "Chế độ Chính tả",
    "Correct Answers:": "Câu đúng:",
    "decks": "bộ thẻ",
    "Get started by creating your first deck.": "Tạo bộ thẻ đầu tiên để bắt đầu học nhé!",
    "Streak": "Chuỗi ngày",
    "Sort by": "Sắp xếp theo",
    "Name": "Tên",
    "Last Studied": "Học lần cuối",
    "Created At": "Ngày tạo"
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('english');

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'english' ? 'vietnamese' : 'english');
    };

    const t = (key: string, ...args: (string | number)[]): string => {
        let text = '';
        if (language === 'english') {
            text = key;
        } else {
            text = translations[key] || key;
        }

        // Replace placeholders {0}, {1}, etc.
        args.forEach((arg, index) => {
            text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
        });

        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
