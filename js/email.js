/* Email-Entwürfe: Erstellen, Bearbeiten, Versenden */

const emailLib = {
  templates: [
    {
      id: 'new',
      name: 'Leere Vorlage',
      subject: '',
      body: ''
    },
    {
      id: 'kurs-info',
      name: 'Kurs-Information',
      subject: 'Information zu Ihrem Yoga-Kurs',
      body: 'Liebe Kursteilnehmerin, lieber Kursteilnehmer,\n\nwir freuen uns auf Sie in unserem kommenden Yoga-Kurs!\n\nMit herzlichen Grüßen'
    },
    {
      id: 'ausfallinfo',
      name: 'Ausfallmitteilung',
      subject: 'Wichtig: Yoga-Kurs fällt aus',
      body: 'Liebe Kursteilnehmerin, lieber Kursteilnehmer,\n\nleider muss der kommende Kurs kurzfristig ausfallen.\n\nWir entschuldigen uns für die Unannehmlichkeiten.\n\nMit freundlichen Grüßen'
    },
    {
      id: 'aenderung',
      name: 'Terminänderung',
      subject: 'Änderung des Kurstermins',
      body: 'Liebe Kursteilnehmerin, lieber Kursteilnehmer,\n\nwir müssen den Termin des kommenden Kurses verschieben.\n\nNeuer Termin: [Datum und Uhrzeit]\n\nMit freundlichen Grüßen'
    }
  ],

  getDrafts() {
    return state.settings.emailDrafts || [];
  },

  saveDraft(draft) {
    if (!state.settings.emailDrafts) state.settings.emailDrafts = [];
    const idx = state.settings.emailDrafts.findIndex(d => d.id === draft.id);
    if (idx >= 0) {
      state.settings.emailDrafts[idx] = draft;
    } else {
      draft.id = uid();
      draft.created = todayIso();
      state.settings.emailDrafts.push(draft);
    }
    save();
    return draft;
  },

  deleteDraft(draftId) {
    state.settings.emailDrafts = (state.settings.emailDrafts || []).filter(d => d.id !== draftId);
    save();
  },

  createDraftFromTemplate(templateId) {
    const tpl = emailLib.templates.find(t => t.id === templateId);
    return {
      id: null,
      name: (tpl?.name || 'Entwurf') + ' ' + new Date().toLocaleDateString('de-DE'),
      subject: tpl?.subject || '',
      body: tpl?.body || '',
      recipients: [],
      created: todayIso(),
      modified: todayIso()
    };
  }
};

function renderEmailView() {
  const drafts = emailLib.getDrafts();
  const tab = ui.emailTab || 'list';
  const currentDraft = ui.currentEmailDraftId
    ? drafts.find(d => d.id === ui.currentEmailDraftId)
    : null;

  let html = '<div class="email-view">';
  html += '<div class="email-tabs">';
  html += `<button class="tab-btn ${tab === 'list' ? 'active' : ''}" onclick="ui.emailTab = 'list'; render()">Übersicht</button>`;
  html += `<button class="tab-btn ${tab === 'edit' ? 'active' : ''}" onclick="ui.emailTab = 'edit'; render()">Entwurf ${currentDraft ? '✎' : ''}</button>`;
  html += '</div>';

  if (tab === 'list') {
    html += renderEmailListTab(drafts);
  } else if (tab === 'edit') {
    html += renderEmailEditTab(currentDraft, drafts);
  }

  html += '</div>';
  return html;
}

function renderEmailListTab(drafts) {
  let html = '<div class="email-list">';
  html += '<div class="email-toolbar">';
  html += '<h2>Email-Entwürfe</h2>';
  html += '<div class="toolbar-actions">';

  html += '<div class="dropdown-like"><button class="btn btn-sec" onclick="ui.emailTemplateMenu = !ui.emailTemplateMenu">+ Aus Vorlage</button>';
  if (ui.emailTemplateMenu) {
    html += '<div class="dropdown-menu">';
    emailLib.templates.forEach(t => {
      html += `<button class="dropdown-item" onclick="
        ui.currentEmailDraftId = null;
        const draft = emailLib.createDraftFromTemplate('${t.id}');
        emailLib.saveDraft(draft);
        ui.currentEmailDraftId = draft.id;
        ui.emailTab = 'edit';
        render();
      ">${t.name}</button>`;
    });
    html += '</div>';
  }
  html += '</div>';

  html += `<button class="btn btn-sec" onclick="
    const draft = { name: 'Neuer Entwurf', subject: '', body: '', recipients: [] };
    emailLib.saveDraft(draft);
    ui.currentEmailDraftId = draft.id;
    ui.emailTab = 'edit';
    render();
  ">+ Neuer Entwurf</button>';
  html += '</div>';
  html += '</div>';

  if (drafts.length === 0) {
    html += '<div class="empty-state">Keine Email-Entwürfe vorhanden. Erstellen Sie einen neuen Entwurf!</div>';
  } else {
    html += '<div class="email-drafts-list">';
    drafts.forEach(draft => {
      const subject = draft.subject || '(kein Betreff)';
      const recipientCount = (draft.recipients || []).length;
      const previewText = draft.body.substring(0, 60).replace(/\n/g, ' ') + (draft.body.length > 60 ? '...' : '');

      html += `<div class="email-draft-card ${ui.currentEmailDraftId === draft.id ? 'active' : ''}">
        <div class="draft-header" onclick="ui.currentEmailDraftId = '${draft.id}'; ui.emailTab = 'edit'; render()">
          <div class="draft-title">${esc(draft.name)}</div>
          <div class="draft-subject"><strong>Betreff:</strong> ${esc(subject)}</div>
        </div>
        <div class="draft-meta">
          <span class="draft-date">${draft.modified || draft.created}</span>
          <span class="draft-recipients">${recipientCount} Empfänger</span>
        </div>
        <div class="draft-actions">
          <button class="btn-icon" title="Bearbeiten" onclick="ui.currentEmailDraftId = '${draft.id}'; ui.emailTab = 'edit'; render()">✎</button>
          <button class="btn-icon danger" title="Löschen" onclick="
            if (confirmTwice(this, 'email-${draft.id}', 'Entwurf wird gelöscht')) {
              emailLib.deleteDraft('${draft.id}');
              if (ui.currentEmailDraftId === '${draft.id}') { ui.currentEmailDraftId = null; }
              render();
            }
          ">🗑</button>
        </div>
      </div>`;
    });
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function renderEmailEditTab(draft, allDrafts) {
  let html = '<div class="email-editor">';

  if (!draft) {
    html += '<div class="empty-state">Wählen Sie einen Entwurf oder erstellen Sie einen neuen.</div>';
  } else {
    html += '<div class="email-form">';
    html += '<div class="form-section">';
    html += `<label>Entwurf-Name</label>`;
    html += `<input type="text" class="full-width" value="${esc(draft.name)}" onchange="
      const d = emailLib.getDrafts().find(x => x.id === '${draft.id}');
      if (d) { d.name = this.value; d.modified = todayIso(); emailLib.saveDraft(d); }
    ">`;
    html += '</div>';

    html += '<div class="form-section">';
    html += `<label>Empfänger (kommagetrennt oder pro Zeile)</label>`;
    const recipientText = (draft.recipients || []).join('\n');
    html += `<textarea class="full-width" rows="4" onchange="
      const d = emailLib.getDrafts().find(x => x.id === '${draft.id}');
      if (d) {
        d.recipients = this.value.split(/[,\n]/).map(r => r.trim()).filter(r => r);
        d.modified = todayIso();
        emailLib.saveDraft(d);
      }
    ">${esc(recipientText)}</textarea>`;
    html += '</div>';

    html += '<div class="form-section">';
    html += `<label>Betreff</label>`;
    html += `<input type="text" class="full-width" value="${esc(draft.subject)}" onchange="
      const d = emailLib.getDrafts().find(x => x.id === '${draft.id}');
      if (d) { d.subject = this.value; d.modified = todayIso(); emailLib.saveDraft(d); }
    ">`;
    html += '</div>';

    html += '<div class="form-section">';
    html += `<label>Nachricht</label>`;
    html += `<textarea class="full-width email-body" rows="15" onchange="
      const d = emailLib.getDrafts().find(x => x.id === '${draft.id}');
      if (d) { d.body = this.value; d.modified = todayIso(); emailLib.saveDraft(d); }
    " onkeyup="this.onchange()">${esc(draft.body)}</textarea>`;
    html += '</div>';

    html += '<div class="email-preview">';
    html += '<h3>Vorschau</h3>';
    html += `<div class="preview-box">
      <div class="preview-subject"><strong>Betreff:</strong> ${esc(draft.subject)}</div>
      <div class="preview-recipients"><strong>An:</strong> ${(draft.recipients || []).join(', ') || '(keine)'}</div>
      <div class="preview-body"><pre>${esc(draft.body)}</pre></div>
    </div>`;
    html += '</div>';

    html += '<div class="email-actions">';
    if ((draft.recipients || []).length > 0) {
      html += `<button class="btn btn-primary" onclick="emailLib.sendDraft('${draft.id}')">
        📧 Versenden (${draft.recipients.length})
      </button>`;
    }
    html += `<button class="btn btn-sec" onclick="downloadEmailDraft('${draft.id}')">💾 Speichern unter</button>`;
    html += '</div>';

    html += '</div>';
  }

  html += '</div>';
  return html;
}

function downloadEmailDraft(draftId) {
  const drafts = emailLib.getDrafts();
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) return;

  let text = `Betreff: ${draft.subject}\nEmpfänger: ${(draft.recipients || []).join('; ')}\n\n${draft.body}`;
  let fileName = fileName(draft.name || 'email') + '.txt';
  download(fileName, text);
}

emailLib.sendDraft = function(draftId) {
  const drafts = emailLib.getDrafts();
  const draft = drafts.find(d => d.id === draftId);
  if (!draft || !draft.recipients || draft.recipients.length === 0) {
    toast('Keine Empfänger angegeben.');
    return;
  }

  const recipients = draft.recipients.join(';');
  const subject = encodeURIComponent(draft.subject);
  const body = encodeURIComponent(draft.body);

  const mailtoLink = `mailto:${recipients}?subject=${subject}&body=${body}`;
  window.location.href = mailtoLink;

  toast(`Email-Programm öffnet sich mit ${draft.recipients.length} Empfänger(n).`, 4000);
};
