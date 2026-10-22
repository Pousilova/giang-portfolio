# Giang Portfolio

Website portfolio cá nhân, xây bằng Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript, và Lenis cho cuộn mượt.

@AGENTS.md

## Lệnh thường dùng
- `npm run dev`: chạy local tại http://localhost:3000
- `npm run build`: kiểm tra build trước khi push
- `npm run lint`: chạy ESLint

## Cấu trúc
- `app/`: routes và layout của Next.js
- `app/components/`: các component của từng section (ví dụ `IeltsOverview.tsx`, `LearningSection.tsx`, `TransitionStory.tsx`)
- `public/images/`: hình ảnh tĩnh, không đặt file cài đặt `.exe` ở đây

## Quy trình làm việc
- Deploy tự động qua Vercel khi push. Push lên `main` sẽ lên production.
- Thay đổi thiết kế lớn nên làm trên branch riêng để Vercel tạo preview URL, merge vào `main` khi đã ổn.
- Trước khi commit, chạy `npm run build` để chắc build không lỗi.
- Không commit các file không liên quan đến website, ví dụ file cài đặt hoặc cấu hình skill trong `.agents/`.

## Ngôn ngữ và phong cách
- Nội dung hiển thị trên website viết bằng tiếng Việt, giữ thuật ngữ kỹ thuật bằng tiếng Anh khi cần.
- Trao đổi với người dùng bằng tiếng Việt.
- Hỏi lại trước khi thay đổi lớn về bố cục hoặc màu sắc.
