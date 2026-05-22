import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Paperclip,
  Redo2,
  Type,
  Underline,
  Undo2,
} from "lucide-react";

interface EmailComposerProps {
  title: string;
  subtitle: string;
  fromLabel: string;
  to: string;
  onToChange: (value: string) => void;
  defaultCc: string;
  extraCcLabel: string;
  extraCc: string;
  onExtraCcChange: (value: string) => void;
  subject: string;
  onSubjectChange: (value: string) => void;
  bodyHtml: string;
  onBodyHtmlChange: (value: string) => void;
  attachmentLabel?: string;
  attachmentNote?: string;
  helperActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  knownRecipients?: string[];
}

const splitRecipients = (value: string): string[] =>
  value
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const getRecipientDraft = (value: string) => {
  const match = value.match(/^(.*[;,]\s*)?([^;,]*)$/);
  return {
    prefix: match?.[1] || "",
    token: (match?.[2] || "").trim(),
  };
};

const replaceRecipientDraft = (value: string, recipient: string) => {
  const { prefix } = getRecipientDraft(value);
  return `${prefix}${recipient}, `;
};

const RecipientAutocompleteInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  knownRecipients: string[];
}> = ({ value, onChange, placeholder, knownRecipients }) => {
  const [isFocused, setIsFocused] = useState(false);

  const suggestions = useMemo(() => {
    const selectedRecipients = new Set(
      splitRecipients(value).map((recipient) => recipient.toLowerCase()),
    );
    const { token } = getRecipientDraft(value);
    const normalizedToken = token.toLowerCase();
    const availableRecipients = knownRecipients.filter(
      (recipient) => !selectedRecipients.has(recipient.toLowerCase()),
    );

    if (!normalizedToken) {
      return availableRecipients.slice(0, 6);
    }

    const prioritizedMatches = availableRecipients
      .filter((recipient) => recipient.toLowerCase().includes(normalizedToken))
      .sort((left, right) => {
        const leftValue = left.toLowerCase();
        const rightValue = right.toLowerCase();
        const leftStartsWith = leftValue.startsWith(normalizedToken);
        const rightStartsWith = rightValue.startsWith(normalizedToken);

        if (leftStartsWith !== rightStartsWith) {
          return leftStartsWith ? -1 : 1;
        }

        return leftValue.localeCompare(rightValue);
      });

    if (prioritizedMatches.length > 0) {
      return prioritizedMatches.slice(0, 6);
    }

    return availableRecipients.slice(0, 6);
  }, [knownRecipients, value]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 120)}
        placeholder={placeholder}
        className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full"
      />
      {isFocused && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white border border-slate-200 rounded-2xl shadow-lg z-20 overflow-hidden">
          {suggestions.map((recipient) => (
            <button
              key={recipient}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(replaceRecipientDraft(value, recipient));
                setIsFocused(false);
              }}
              className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              {recipient}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const EmailComposer: React.FC<EmailComposerProps> = ({
  title,
  subtitle,
  fromLabel,
  to,
  onToChange,
  defaultCc,
  extraCcLabel,
  extraCc,
  onExtraCcChange,
  subject,
  onSubjectChange,
  bodyHtml,
  onBodyHtmlChange,
  attachmentLabel,
  attachmentNote,
  helperActions = [],
  knownRecipients = [],
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== bodyHtml) {
      editorRef.current.innerHTML = bodyHtml;
    }
  }, [bodyHtml]);

  const defaultCcList = useMemo(() => splitRecipients(defaultCc), [defaultCc]);

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    onBodyHtmlChange(editorRef.current?.innerHTML || "");
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    runCommand("insertImage", dataUrl);
    event.target.value = "";
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.9fr] gap-8 h-full">
      <div className="bg-white border border-slate-200 rounded-[28px] shadow-sm overflow-hidden flex flex-col min-h-[720px]">
        <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="mt-2 text-slate-500">{subtitle}</p>
        </div>

        <div className="px-8 py-5 space-y-4 border-b border-slate-200 bg-white">
          <div className="grid grid-cols-[96px_1fr] gap-4 items-center">
            <span className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              De
            </span>
            <div className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 flex items-center text-sm font-semibold text-slate-600">
              {fromLabel}
            </div>
          </div>

          <div className="grid grid-cols-[96px_1fr] gap-4 items-center">
            <span className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              Para
            </span>
            <RecipientAutocompleteInput
              value={to}
              onChange={onToChange}
              placeholder="destinatario@dominio.com"
              knownRecipients={knownRecipients}
            />
          </div>

          <div className="grid grid-cols-[96px_1fr] gap-4 items-start">
            <span className="text-xs font-black uppercase tracking-[0.24em] text-slate-400 pt-3">
              Cc
            </span>
            <div className="space-y-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">
                  Copias por defecto del aeropuerto
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {defaultCcList.length > 0 ? (
                    defaultCcList.map((email) => (
                      <span
                        key={email}
                        className="px-3 py-1.5 rounded-full bg-white border border-blue-200 text-blue-700 text-xs font-bold"
                      >
                        {email}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      No hay correos por defecto configurados.
                    </span>
                  )}
                </div>
              </div>
              <RecipientAutocompleteInput
                value={extraCc}
                onChange={onExtraCcChange}
                placeholder={extraCcLabel}
                knownRecipients={knownRecipients}
              />
            </div>
          </div>

          <div className="grid grid-cols-[96px_1fr] gap-4 items-center">
            <span className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              Asunto
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => runCommand("bold")}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => runCommand("italic")}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => runCommand("underline")}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => runCommand("insertUnorderedList")}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => runCommand("insertOrderedList")}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => runCommand("formatBlock", "<h2>")}
            className="px-4 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100 text-xs font-black uppercase tracking-widest"
          >
            <Type className="w-4 h-4 mr-2" /> Título
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100 text-xs font-black uppercase tracking-widest"
          >
            <ImagePlus className="w-4 h-4 mr-2" /> Imagen
          </button>
          <button
            type="button"
            onClick={() => runCommand("undo")}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => runCommand("redo")}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-100"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          {helperActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="px-4 h-10 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800"
            >
              {action.label}
            </button>
          ))}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        <div className="flex-1 bg-white">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => onBodyHtmlChange(e.currentTarget.innerHTML)}
            className="h-full min-h-[360px] p-8 outline-none text-[15px] leading-7 text-slate-800 overflow-auto [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:shadow-md [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-900 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
          />
        </div>
      </div>

      <div className="bg-slate-100 border border-slate-200 rounded-[28px] shadow-inner overflow-hidden flex flex-col min-h-[720px]">
        <div className="px-6 py-5 border-b border-slate-200 bg-white/70 backdrop-blur-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
            Vista previa
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Así verá el destinatario la composición dentro del sistema.
          </p>
        </div>

        <div className="p-6 overflow-auto flex-1">
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 space-y-3">
              <div className="grid grid-cols-[70px_1fr] gap-3 text-sm">
                <span className="font-black uppercase tracking-widest text-slate-400 text-[10px]">
                  Para
                </span>
                <span className="font-semibold text-slate-700 break-all">{to || "Sin destinatarios"}</span>
              </div>
              <div className="grid grid-cols-[70px_1fr] gap-3 text-sm">
                <span className="font-black uppercase tracking-widest text-slate-400 text-[10px]">
                  Cc
                </span>
                <div className="font-semibold text-slate-700 break-all">
                  {[...defaultCcList, ...splitRecipients(extraCc)].join(", ") ||
                    "Sin copia"
                  }
                </div>
              </div>
              <div className="grid grid-cols-[70px_1fr] gap-3 text-sm">
                <span className="font-black uppercase tracking-widest text-slate-400 text-[10px]">
                  Asunto
                </span>
                <span className="font-semibold text-slate-800">{subject || "Sin asunto"}</span>
              </div>
            </div>

            <div className="p-8 min-h-[420px] bg-white text-slate-800 leading-7 [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:shadow-md [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-900 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6" dangerouslySetInnerHTML={{ __html: bodyHtml || "<p style='color:#94a3b8;'>Empiece a redactar el cuerpo del correo...</p>" }} />

            {attachmentLabel && (
              <div className="mx-6 mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-start">
                <Paperclip className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{attachmentLabel}</p>
                  {attachmentNote && (
                    <p className="text-xs text-slate-500 mt-1">{attachmentNote}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};