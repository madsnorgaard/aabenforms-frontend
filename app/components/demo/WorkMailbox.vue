<template>
  <figure class="work-mail" data-testid="work-mailbox">
    <figcaption class="work-mail__caption">{{ $t('demo.workMail.caption') }}</figcaption>
    <div class="work-mail__window">
      <div class="work-mail__titlebar">
        <span class="work-mail__app">{{ $t('demo.workMail.app') }}</span>
        <span class="work-mail__account">{{ account }}</span>
      </div>
      <div class="work-mail__body">
        <!-- Decoration that frames the message; screen readers get the message only. -->
        <div class="work-mail__folders" aria-hidden="true">
          <ul class="nobullet-list">
            <li class="work-mail__folder work-mail__folder--active">
              {{ $t('demo.workMail.inbox') }} <span class="work-mail__count">1</span>
            </li>
            <li class="work-mail__folder">{{ $t('demo.workMail.sent') }}</li>
            <li class="work-mail__folder">{{ $t('demo.workMail.archive') }}</li>
          </ul>
        </div>
        <div class="work-mail__list" aria-hidden="true">
          <div class="work-mail__row work-mail__row--unread">
            <span class="work-mail__row-from">{{ sender }}</span>
            <span class="work-mail__row-subject">{{ subject }}</span>
            <span class="work-mail__row-time">{{ $t('demo.workMail.now') }}</span>
          </div>
        </div>
        <article class="work-mail__message" data-testid="work-mail-message">
          <h2 class="work-mail__subject">{{ subject }}</h2>
          <dl class="work-mail__headers">
            <dt>{{ $t('demo.workMail.from') }}</dt>
            <dd>{{ sender }}</dd>
            <dt>{{ $t('demo.workMail.to') }}</dt>
            <dd>{{ account }}</dd>
          </dl>
          <!-- The text of hook_mail 'case_handler_notice' in aabenforms_workflows. -->
          <p>{{ $t('demo.workMail.line1') }}</p>
          <p>{{ $t('demo.workMail.line2') }}</p>
          <p>
            <a :href="link" class="work-mail__link" data-testid="work-mail-link">{{ $t('demo.workMail.open') }}</a>
          </p>
          <p class="work-mail__footnote">{{ $t('demo.workMail.line3') }}</p>
        </article>
      </div>
    </div>
  </figure>
</template>

<script setup lang="ts">
// A simulated work mailbox showing the notice the backend e-mails the case
// handler (school leader) when a case awaits a decision. The real e-mail has
// no personal data, only the case number and a link to the staff login, so
// the presentation shows nothing the actual message would not.
const props = defineProps<{
  /** Case number for the subject line; the backend omits it when unknown. */
  caseId: number | null
  /** The staff login link the e-mail carries. */
  link: string
  /** The recipient, e.g. the school leader's work mailbox. */
  account: string
}>()

const { t } = useI18n()
const sender = computed(() => t('demo.workMail.sender'))
const subject = computed(() => props.caseId
  ? t('demo.workMail.subjectWithId', { id: props.caseId })
  : t('demo.workMail.subject'))
</script>

<style scoped>
.work-mail {
  margin: 0;
}

.work-mail__caption {
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.8rem;
}

/* Deliberately not DKFDS citizen styling: this is the employee's own tool. */
.work-mail__window {
  border: 1px solid #b8b8b8;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.08);
}

.work-mail__titlebar {
  display: flex;
  justify-content: space-between;
  gap: 1.6rem;
  flex-wrap: wrap;
  padding: 0.8rem 1.6rem;
  background: #2b3a4a;
  color: #fff;
  font-size: 1.4rem;
}

.work-mail__app {
  font-weight: 600;
}

.work-mail__body {
  display: grid;
  grid-template-columns: 15rem 22rem 1fr;
  min-height: 32rem;
}

.work-mail__folders {
  background: #f2f2f2;
  border-right: 1px solid #d9d9d9;
  padding: 1.2rem 0;
  font-size: 1.4rem;
}

.work-mail__folder {
  padding: 0.6rem 1.6rem;
  display: flex;
  justify-content: space-between;
}

.work-mail__folder--active {
  background: #dde6ef;
  font-weight: 600;
}

.work-mail__count {
  font-weight: 600;
}

.work-mail__list {
  border-right: 1px solid #d9d9d9;
  font-size: 1.4rem;
}

.work-mail__row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.2rem 0.8rem;
  padding: 1.2rem 1.6rem;
  border-bottom: 1px solid #e6e6e6;
  border-left: 4px solid transparent;
}

.work-mail__row--unread {
  background: #eef3f8;
  border-left-color: #0059b3;
  font-weight: 600;
}

.work-mail__row-from {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-mail__row-subject {
  grid-column: 1 / -1;
  font-weight: 400;
}

.work-mail__row-time {
  font-weight: 400;
  color: #545454;
}

.work-mail__message {
  padding: 1.6rem 2.4rem 2.4rem;
}

.work-mail__subject {
  font-size: 2rem;
  margin: 0 0 1.2rem;
}

.work-mail__headers {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.2rem 1.2rem;
  margin: 0 0 1.6rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid #e6e6e6;
  font-size: 1.4rem;
}

.work-mail__headers dt {
  font-weight: 600;
}

.work-mail__headers dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.work-mail__link {
  font-weight: 600;
}

.work-mail__footnote {
  color: #545454;
  font-size: 1.4rem;
}

@media (max-width: 991px) {
  .work-mail__body {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .work-mail__folders,
  .work-mail__list {
    display: none;
  }
}
</style>
